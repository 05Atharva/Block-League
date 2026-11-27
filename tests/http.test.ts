import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "../server/index.ts";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { once } from "node:events";
import { legalMoves, replay } from "../shared/engine.ts";
test("HTTP transport: two independent clients play, reconnect and see the same final result", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bl-http-"));
  const { server } = startServer({ port: 0, file: join(dir, "data.json") });
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const call = async (action: string, data: any = {}, token = "") => {
    const r = await fetch(base + "/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ action, data }),
    });
    const j = await r.json();
    assert.equal(j.ok, true, j.error);
    return j.result;
  };
  try {
    assert.equal((await (await fetch(base + "/health")).json()).ok, true);
    const a = await call("register", { alias: "HTTP A", age: "25-44" }),
      b = await call("register", { alias: "HTTP B", age: "45-65" });
    let room = await call("room.create", {}, a.token);
    await call("room.join", { code: room.code }, b.token);
    await call("room.ready", { code: room.code }, a.token);
    await call("room.ready", { code: room.code }, b.token);
    for (const u of [a, b]) {
      let r = await call("room.get", { code: room.code }, u.token);
      for (let i = 0; i < 5; i++) {
        const move = {
          ...legalMoves(r.game)[i % legalMoves(r.game).length],
          seq: r.game.moves.length,
          id: `${u.user.id}-${i}`,
        };
        r = await call("room.move", { code: room.code, move }, u.token);
      }
      assert.equal(r.game.score, replay(r.game.seed, r.game.moves).score);
      assert.equal(r.replays, undefined);
      await call("room.finish", { code: room.code }, u.token);
    }
    const ra = await call("room.get", { code: room.code }, a.token),
      rb = await call("room.get", { code: room.code }, b.token);
    assert.equal(ra.status, "final");
    assert.deepEqual(ra.result, rb.result);
    assert.equal(ra.replays.length, 2);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(dir, { recursive: true });
  }
});

test("account deletion validates confirmation, erases credentials and cloud data, and preserves an anonymised replay", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bl-delete-"));
  const { server, service } = startServer({
    port: 0,
    file: join(dir, "data.json"),
  });
  await once(server, "listening");
  const base =
    "http://127.0.0.1:" + (server.address() as { port: number }).port;
  try {
    const owner = service.dispatch("register", {
      alias: "Deletion Test Account",
      age: "25-44",
    });
    const friend = service.dispatch("register", {
      alias: "Friend",
      age: "25-44",
    });
    const recovered = service.dispatch("recover", { recovery: owner.recovery });
    service.dispatch(
      "progress.sync",
      { revision: 0, progress: { best: 120, stars: 2, history: [] } },
      owner.token,
    );
    const room = service.dispatch(
      "room.create",
      { kind: "async" },
      owner.token,
    );
    const seat = { code: room.code };
    service.dispatch("room.join", seat, friend.token);
    service.dispatch("room.ready", seat, owner.token);
    service.dispatch(
      "room.react",
      { ...seat, text: "Good game!" },
      owner.token,
    );
    const move = { ...legalMoves(room.game)[0], seq: 0, id: "preserve-move" };
    service.dispatch("room.move", { ...seat, move }, owner.token);
    service.dispatch("room.finish", seat, owner.token);
    const final = service.dispatch("room.finish", seat, friend.token);

    const publicPage = await fetch(base + "/account-deletion");
    assert.equal(publicPage.headers.get("cache-control"), "no-store");
    assert.match(await publicPage.text(), /Delete your Block League account/);
    const noConfirm = await fetch(base + "/account-deletion", {
      method: "POST",
      body: new URLSearchParams({ recovery: owner.recovery }),
    });
    assert.equal(noConfirm.status, 400);
    assert.equal(
      service.dispatch("me", {}, owner.token).cloud.progress.best,
      120,
    );
    assert.throws(
      () => service.dispatch("account.delete", { confirm: false }, owner.token),
      /confirm/i,
    );
    const deleted = await fetch(base + "/account-deletion", {
      method: "POST",
      body: new URLSearchParams({ recovery: owner.recovery, confirm: "yes" }),
    });
    assert.equal(deleted.status, 200);
    assert.match(await deleted.text(), /Your online account was deleted/);
    assert.throws(() => service.dispatch("me", {}, owner.token), /sign in/i);
    assert.throws(
      () => service.dispatch("me", {}, recovered.token),
      /sign in/i,
    );
    assert.throws(
      () => service.dispatch("recover", { recovery: owner.recovery }),
      /not recognised/i,
    );
    const archived = service.dispatch("room.get", seat, friend.token);
    assert.deepEqual(archived.result, final.result);
    assert.equal(archived.replays[0].alias, "Deleted player");
    assert.equal(archived.replays[0].game.moves.length, 1);
    assert.deepEqual(archived.reactions, []);
    assert.equal(service.db.users[owner.user.id].cloud, undefined);
    assert.equal(service.db.users[owner.user.id].recovery, "");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(dir, { recursive: true });
  }
});
