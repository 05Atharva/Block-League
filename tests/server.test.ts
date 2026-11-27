import test from "node:test";
import assert from "node:assert/strict";
import { Service } from "../server/service.ts";
import { legalMoves, place, replay } from "../shared/engine.ts";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
function setup() {
  let time = 1000000;
  const s = new Service(undefined, () => time);
  const a = s.dispatch("register", { alias: "Player A", age: "18-24" }),
    b = s.dispatch("register", { alias: "Player B", age: "13-17" });
  return { s, a, b, advance: (n: number) => (time += n) };
}
function match(s: Service, a: any, b: any, kind = "live") {
  const r = s.dispatch("room.create", { kind }, a.token);
  s.dispatch("room.join", { code: r.code }, b.token);
  s.dispatch("room.ready", { code: r.code }, a.token);
  if (kind === "live") s.dispatch("room.ready", { code: r.code }, b.token);
  return s.dispatch("room.get", { code: r.code }, a.token);
}
test("same pieces, independent boards, score replay and hidden opponent moves", () => {
  const { s, a, b } = setup();
  let r = match(s, a, b);
  const br = s.dispatch("room.get", { code: r.code }, b.token);
  assert.deepEqual(br.game.tray, r.game.tray);
  assert.equal(br.game.seed, r.game.seed);
  assert.equal(r.replays, undefined);
  const m = { ...legalMoves(r.game)[0], seq: 0, id: "a" };
  r = s.dispatch("room.move", { code: r.code, move: m }, a.token);
  assert.equal(
    s.dispatch("room.get", { code: r.code }, b.token).game.moves.length,
    0,
  );
  assert.equal(replay(r.game.seed, r.game.moves).score, r.game.score);
  assert.equal(r.replays, undefined);
  s.dispatch("room.finish", { code: r.code }, a.token);
  r = s.dispatch("room.finish", { code: r.code }, b.token);
  assert.equal(r.status, "final");
  assert.equal(r.replays.length, 2);
  assert.equal(r.result.winner, a.user.id);
});
test("invitation preview reveals only terms and never occupies a seat", () => {
  const { s, a, b, advance } = setup();
  const room = s.dispatch("room.create", { kind: "async" }, a.token);
  const invite = s.dispatch(
    "room.preview",
    { code: room.code.toLowerCase() },
    b.token,
  );
  assert.deepEqual(invite, {
    code: room.code,
    kind: "async",
    expiresAt: room.deadline,
    placements: 30,
  });
  assert.equal(
    s.dispatch("room.get", { code: room.code }, a.token).players.length,
    1,
  );
  const child = s.dispatch("register", { alias: "Child tester", age: "7-12" });
  assert.throws(
    () => s.dispatch("room.preview", { code: room.code }, child.token),
    /guardian/,
  );
  advance(86400001);
  assert.throws(
    () => s.dispatch("room.preview", { code: room.code }, b.token),
    /expired/,
  );
  assert.throws(
    () => s.dispatch("room.join", { code: invite.code }, b.token),
    /expired/,
  );
});

test("season names are preserved within the shared limit and rejected above it", () => {
  const { s, a } = setup();
  const name = "Mobile QA Six Hour Season";
  const league = s.dispatch(
    "league.create",
    { name, size: 4, windowHours: 6 },
    a.token,
  );
  assert.equal(league.name, name);
  assert.throws(
    () =>
      s.dispatch("league.create", { name: "x".repeat(41), size: 4 }, a.token),
    /too long/,
  );
});
test("idempotent move retry and final result; action ID collision rejected", () => {
  const { s, a, b } = setup();
  let r = match(s, a, b);
  const move = { ...legalMoves(r.game)[0], seq: 0, id: "once" };
  r = s.dispatch("room.move", { code: r.code, move }, a.token);
  const score = r.game.score;
  assert.equal(
    s.dispatch("room.move", { code: r.code, move }, a.token).game.score,
    score,
  );
  assert.throws(
    () =>
      s.dispatch(
        "room.move",
        { code: r.code, move: { ...move, row: 7 } },
        a.token,
      ),
    /different/,
  );
  s.dispatch("room.finish", { code: r.code }, a.token);
  s.dispatch("room.finish", { code: r.code }, b.token);
  const result = JSON.stringify(s.db.rooms[r.code].result);
  s.tick();
  assert.equal(JSON.stringify(s.db.rooms[r.code].result), result);
});
test("offline async batches commit atomically, recover lost acknowledgements, and keep scores authoritative", () => {
  const { s, a, b, advance } = setup();
  const room = match(s, a, b, "async");
  const first = { ...legalMoves(room.game)[0], seq: 0, id: "queued-1" };
  const afterFirst = place(room.game, first);
  const second = { ...legalMoves(afterFirst)[0], seq: 1, id: "queued-2" };
  const correct = { code: room.code, moves: [first, second], finish: true };
  assert.throws(
    () =>
      s.dispatch(
        "room.submitAsync",
        {
          ...correct,
          moves: [first, { ...second, seq: 3 }],
        },
        a.token,
      ),
    /stale/,
  );
  assert.equal(
    s.dispatch("room.get", { code: room.code }, a.token).game.moves.length,
    0,
  );
  const confirmed = s.dispatch("room.submitAsync", correct, a.token);
  assert.equal(
    confirmed.game.score,
    replay(room.game.seed, [first, second]).score,
  );
  assert.equal(confirmed.game.done, true);
  assert.equal(confirmed.replays, undefined);
  s.dispatch("room.finish", { code: room.code }, b.token);
  advance(86400001);
  const retry = s.dispatch("room.submitAsync", correct, a.token);
  assert.equal(retry.status, "final");
  assert.deepEqual(retry.game, confirmed.game);
  assert.throws(
    () =>
      s.dispatch(
        "room.submitAsync",
        {
          ...correct,
          moves: [{ ...first, row: first.row + 1 }],
        },
        a.token,
      ),
    /different/,
  );
  const list = s.dispatch("rooms", {}, a.token);
  assert.equal(
    list.find((entry: any) => entry.code === room.code).ownDone,
    true,
  );
  assert.equal(
    typeof list.find((entry: any) => entry.code === room.code).finishedAt,
    "number",
  );
});
test("new offline moves are refused after the deadline and in live matches", () => {
  const { s, a, b, advance } = setup();
  const asyncRoom = match(s, a, b, "async");
  const live = match(s, a, b);
  assert.throws(
    () =>
      s.dispatch(
        "room.submitAsync",
        {
          code: live.code,
          moves: [],
          finish: true,
        },
        a.token,
      ),
    /only available/,
  );
  advance(86400001);
  const first = { ...legalMoves(asyncRoom.game)[0], seq: 0, id: "expired" };
  assert.throws(
    () =>
      s.dispatch(
        "room.submitAsync",
        {
          code: asyncRoom.code,
          moves: [first],
          finish: false,
        },
        a.token,
      ),
    /no longer accepting/,
  );
  assert.equal(
    s.dispatch("room.get", { code: asyncRoom.code }, a.token).game.moves.length,
    0,
  );
});
test("ranked rejects boosters, impossible moves, anonymous and outsider access", () => {
  const { s, a, b } = setup();
  const r = match(s, a, b),
    move = { ...legalMoves(r.game)[0], seq: 0, id: "x" };
  assert.throws(
    () => s.dispatch("room.move", { code: r.code, move, undo: true }, a.token),
    /disabled/,
  );
  assert.throws(() =>
    s.dispatch(
      "room.move",
      { code: r.code, move: { ...move, row: 99 } },
      a.token,
    ),
  );
  assert.throws(() => s.dispatch("room.get", { code: r.code }, ""));
  const c = s.dispatch("register", { alias: "Other", age: "18-24" });
  assert.throws(
    () => s.dispatch("room.get", { code: r.code }, c.token),
    /private/,
  );
});
test("60 second reconnect grace restores state, late reconnect closes own attempt", () => {
  const { s, a, b, advance } = setup();
  let r = match(s, a, b);
  advance(45000);
  r = s.dispatch("room.get", { code: r.code }, a.token);
  assert.equal(r.game.done, false);
  advance(30000);
  s.dispatch("room.get", { code: r.code }, a.token);
  assert.equal(
    s.db.rooms[r.code].players.find((p) => p.id === b.user.id)!.game.done,
    true,
  );
});
test("live deadline and async deadline enforced, ties are draws", () => {
  const { s, a, b, advance } = setup();
  const r = match(s, a, b, "async");
  advance(900001);
  assert.equal(
    s.dispatch("room.get", { code: r.code }, a.token).status,
    "playing",
  );
  advance(86400000);
  const done = s.dispatch("room.get", { code: r.code }, a.token);
  assert.equal(done.status, "final");
  assert.equal(done.result.winner, null);
});
test("expired room rejects joining; host can remove an unstarted seat", () => {
  const { s, a, b, advance } = setup();
  const r = s.dispatch("room.create", {}, a.token);
  s.dispatch("room.join", { code: r.code }, b.token);
  assert.equal(
    s.dispatch("room.remove", { code: r.code }, a.token).players.length,
    1,
  );
  advance(900001);
  assert.throws(
    () => s.dispatch("room.join", { code: r.code }, b.token),
    /expired/,
  );
});
test("production disables protected signups and simulated reward offers", () => {
  const s = new Service(undefined, undefined, false, true);
  assert.throws(
    () => s.dispatch("register", { alias: "Protected profile", age: "7-12" }),
    /play offline/,
  );
  const adult = s.dispatch("register", {
    alias: "Production player",
    age: "25-44",
  });
  assert.throws(
    () => s.dispatch("reward.offer", {}, adult.token),
    /unavailable/,
  );
  assert.equal(
    s.dispatch("room.create", { kind: "live" }, adult.token).status,
    "waiting",
  );
});
test("protected children and unknown age have no ad access; guardian gates social", () => {
  const { s } = setup();
  const kid = s.dispatch("register", { alias: "Child", age: "7-12" });
  assert.throws(() => s.dispatch("room.create", {}, kid.token), /guardian/);
  assert.throws(() => s.dispatch("reward.offer", {}, kid.token), /adult/);
  s.dispatch("guardian.setup", { pin: "123456" }, kid.token);
  assert.throws(
    () =>
      s.dispatch("guardian.update", { pin: "000000", social: true }, kid.token),
    /incorrect/,
  );
  s.dispatch(
    "guardian.update",
    { pin: "123456", social: true, sharing: false },
    kid.token,
  );
  assert.ok(s.dispatch("room.create", {}, kid.token).code);
  assert.equal(s.dispatch("me", {}, kid.token).sharing, false);
  const unknown = s.dispatch("register", { alias: "Unknown", age: "unknown" });
  assert.throws(
    () => s.dispatch("room.create", {}, unknown.token),
    /age group/,
  );
});
test("recovery restores the same private account, never another account", () => {
  const { s, a, b } = setup();
  const r = s.dispatch("recover", { recovery: a.recovery });
  assert.equal(r.user.id, a.user.id);
  assert.notEqual(r.user.id, b.user.id);
  assert.notEqual(r.token, a.token);
  assert.throws(() => s.dispatch("recover", { recovery: "wrong" }));
  assert.equal(s.dispatch("me", {}, r.token).recovery, undefined);
});
test("preset reactions only and reporting rate limits", () => {
  const { s, a, b } = setup();
  const r = match(s, a, b);
  assert.throws(() =>
    s.dispatch(
      "room.react",
      { code: r.code, text: "arbitrary personal chat" },
      a.token,
    ),
  );
  s.dispatch("room.react", { code: r.code, text: "Good game!" }, a.token);
  assert.throws(
    () =>
      s.dispatch("room.react", { code: r.code, text: "Nice move!" }, a.token),
    /wait/,
  );
  const report = s.dispatch(
    "report",
    { kind: "room", target: r.code, reason: "Review score please" },
    a.token,
  );
  assert.equal(report.status, "open");
  assert.throws(
    () =>
      s.dispatch(
        "report",
        { kind: "room", target: r.code, reason: "Duplicate report" },
        a.token,
      ),
    /minute/,
  );
});
test("reward provider is explicitly test-only; grants are idempotent and decline is free", () => {
  const { s, a, b } = setup();
  delete process.env.ALLOW_TEST_REWARDS;
  const offer = s.dispatch("reward.offer", {}, a.token);
  assert.throws(
    () =>
      s.dispatch(
        "reward.complete",
        { offer: offer.offer, outcome: "completed" },
        a.token,
      ),
    /not configured/,
  );
  process.env.ALLOW_TEST_REWARDS = "1";
  s.dispatch(
    "reward.complete",
    { offer: offer.offer, outcome: "completed" },
    a.token,
  );
  s.dispatch(
    "reward.complete",
    { offer: offer.offer, outcome: "completed" },
    a.token,
  );
  assert.deepEqual(s.dispatch("me", {}, a.token).rewards, ["aurora"]);
  assert.throws(() => s.dispatch("reward.offer", {}, b.token));
  const skipped = s.dispatch("reward.offer", {}, a.token);
  assert.equal(
    s.dispatch(
      "reward.complete",
      { offer: skipped.offer, outcome: "skipped" },
      a.token,
    ).state,
    "skipped",
  );
  assert.ok(s.dispatch("room.create", {}, a.token).code);
  delete process.env.ALLOW_TEST_REWARDS;
});
test("atomic persistence survives service restart", () => {
  const dir = mkdtempSync(join(tmpdir(), "block-league-"));
  try {
    const path = join(dir, "data.json"),
      s = new Service(path);
    const a = s.dispatch("register", { alias: "Persistent", age: "25-44" });
    const r = s.dispatch("room.create", {}, a.token);
    const restored = new Service(path);
    assert.equal(restored.dispatch("me", {}, a.token).alias, "Persistent");
    assert.equal(
      restored.dispatch("room.get", { code: r.code }, a.token).code,
      r.code,
    );
  } finally {
    rmSync(dir, { recursive: true });
  }
});
test("cloud recovery restores local progress separately from server-verified records", () => {
  const { s, a, b } = setup();
  const progress = {
    best: 1000,
    practiceBest: 2000,
    stars: 5,
    settings: { theme: "dark" },
    saved: null,
    history: [],
    badges: ["first-clear", "league-champion"],
  };
  const saved = s.dispatch("progress.sync", { revision: 0, progress }, a.token);
  assert.equal(saved.revision, 1);
  const recovered = s.dispatch("recover", { recovery: a.recovery });
  assert.equal(recovered.user.cloud.progress.best, 1000);
  assert.deepEqual(recovered.user.cloud.progress.badges, ["first-clear"]);
  assert.equal(recovered.user.best, 0);
  assert.equal(s.dispatch("me", {}, b.token).cloud, undefined);
  assert.throws(
    () => s.dispatch("progress.sync", { revision: 0, progress }, a.token),
    /another device/,
  );
});
