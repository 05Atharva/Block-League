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
