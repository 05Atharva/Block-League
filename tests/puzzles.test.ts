import assert from "node:assert/strict";
import { test } from "node:test";
import { createGame, replay } from "../shared/engine.ts";
import {
  CPU_TIERS,
  DAY,
  JOURNEY,
  cpuMove,
  dailyPuzzle,
  dayNumber,
  puzzleSolved,
  restoreDailyPuzzle,
  streakStats,
  verifyMoves,
  weeklyGame,
  weekNumber,
} from "../shared/puzzles.ts";
import type { Puzzle, Tier } from "../shared/puzzles.ts";
import { Service } from "../server/service.ts";

const solve = (puzzle: Puzzle) =>
  puzzle.solution.map((move, seq) => ({ ...move, seq, id: `test-${seq}` }));
function cpuRun(seed: number, tier: Tier) {
  let game = createGame(seed, 30);
  while (!game.done) game = cpuMove(game, tier);
  return game;
}
function accounts() {
  let now = Date.UTC(2026, 10, 23, 9);
  const service = new Service(undefined, () => now);
  const register = (alias: string, age = "25-44") =>
    service.dispatch("register", { alias, age }, "");
  const alice = register("Practice Alice");
  const bob = register("Practice Bob");
  const call = (session: { token: string }, action: string, data = {}) =>
    service.dispatch(action, data, session.token);
  return {
    service,
    alice,
    bob,
    register,
    call,
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

test("Journey and a year of daily variants have checked solutions across all tiers", () => {
  for (const puzzle of JOURNEY)
    assert.ok(
      puzzleSolved(puzzle, verifyMoves(puzzle.game, solve(puzzle), puzzle)),
      puzzle.title,
    );
  const [row, column] = JOURNEY;
  const rowClear = verifyMoves(row.game, solve(row));
  const columnClear = verifyMoves(column.game, solve(column));
  assert.equal(puzzleSolved(row, columnClear), false);
  assert.equal(puzzleSolved(column, rowClear), false);
  const id = "fixture-player-1";
  const today = dayNumber(Date.UTC(2026, 10, 28));
  for (let offset = 0; offset < 365; offset++) {
    for (let level = 0; level < 3; level++) {
      const puzzle = dailyPuzzle(id, today + offset, level);
      assert.ok(
        puzzleSolved(puzzle, verifyMoves(puzzle.game, solve(puzzle), puzzle)),
        puzzle.id,
      );
      assert.equal(puzzle.game.board.length, 64);
      assert.deepEqual(restoreDailyPuzzle(puzzle.id), puzzle);
    }
  }
  assert.deepEqual(dailyPuzzle(id, today, 0), dailyPuzzle(id, today, 0));
  assert.notEqual(
    dailyPuzzle(id, today, 0).id,
    dailyPuzzle("fixture-player-2", today, 0).id,
  );
  assert.notEqual(
    dailyPuzzle(id, today, 0).id,
    dailyPuzzle(id, today + 1, 0).id,
  );
});

test("cloud recovery preserves roadmap saves while verified streaks stay authoritative", () => {
  const { alice, bob, call } = accounts();
  const extras = {
    version: 1,
    difficulty: 1,
    journey: {},
    dailyArchive: {},
    localDaily: [20000],
    equipped: { title: "month", tags: ["streak"] },
    open: { game: createGame(44), chapters: 2, lines: 7 },
  };
  const olderProgress = {
    best: 15,
    stars: 2,
    settings: {},
    badges: [],
    saved: null,
  };
  assert.equal(
    call(alice, "progress.sync", {
      revision: 0,
      progress: { ...olderProgress, extras },
    }).revision,
    1,
  );
  assert.equal(
    call(alice, "progress.sync", { revision: 1, progress: olderProgress })
      .revision,
    2,
  );
  const recovered = call(alice, "recover", { recovery: alice.recovery });
  assert.deepEqual(recovered.user.cloud.progress.extras, extras);
  const invite = call(alice, "friends.invite");
  call(bob, "friends.join", { code: invite.value });
  call(recovered, "friends.sharing", { enabled: true });
  call(recovered, "friends.display", extras.equipped);
  assert.deepEqual(call(bob, "friends.status").friends[0].shared, {
    current: 0,
    display: { title: "", tags: [] },
  });
});

test("daily credit uses the server clock and a stable, per-account assignment across devices", () => {
  const { alice, bob, call, advance } = accounts();
  const first = call(alice, "puzzle.issue", { difficulty: 2 });
  assert.throws(
    () => call(alice, "puzzle.issue", { difficulty: null }),
    /difficulty/,
  );
  assert.notEqual(
    call(bob, "puzzle.issue", { difficulty: 2 }).puzzle.id,
    first.puzzle.id,
  );
  const recovered = call(alice, "recover", { recovery: alice.recovery });
  assert.deepEqual(call(recovered, "puzzle.issue", { difficulty: 0 }), first);
  const moves = solve(first.puzzle);
  const submit = { day: first.day, id: first.puzzle.id, moves };
  assert.throws(() => call(bob, "puzzle.complete", submit), /different/);
  assert.throws(
    () =>
      call(alice, "puzzle.complete", {
        ...submit,
        moves: [{ ...moves[0], row: 8 }],
      }),
    /does not fit/,
  );
  assert.throws(
    () => call(alice, "puzzle.complete", { ...submit, day: first.day + 1 }),
    /Invalid puzzle day/,
  );
  assert.equal(call(recovered, "puzzle.complete", submit).stats.current, 1);
  advance(DAY);
  assert.equal(call(alice, "puzzle.complete", submit).stats.total, 1);
  const second = call(alice, "puzzle.issue", { difficulty: 1 });
  advance(DAY);
  assert.throws(
    () =>
      call(alice, "puzzle.complete", {
        day: second.day,
        id: second.puzzle.id,
        moves: solve(second.puzzle),
      }),
    /deadline passed/,
  );
  assert.deepEqual(
    call(alice, "puzzle.status").stats,
    streakStats([first.day], first.day + 2),
  );
});

test("friend privacy, eligibility, permanent streak milestones and deletion", () => {
  const { alice, bob, call, advance, register } = accounts();
  const outsider = register("Outsider");
  const child = register("Family", "7-12");
  assert.throws(() => call(child, "friends.status"), /adult|offline/);
  assert.throws(
    () => call(child, "puzzle.issue", { difficulty: 0 }),
    /offline/,
  );
  const invite = call(alice, "friends.invite");
  assert.throws(
    () => call(alice, "friends.join", { code: invite.value }),
    /different/,
  );
  call(bob, "friends.join", { code: invite.value });
  assert.throws(
    () => call(outsider, "friends.join", { code: invite.value }),
    /active code/,
  );
  assert.equal(call(bob, "friends.status").friends[0].shared, null);
  assert.deepEqual(
    call(alice, "friends.display", {
      title: "month",
      tags: ["streak", "cpu", "faceoff"],
    }),
    { title: "", tags: [] },
  );
  for (let i = 0; i < 30; i++) {
    if (i) advance(DAY);
    const { day, puzzle } = call(alice, "puzzle.issue", { difficulty: i % 3 });
    call(alice, "puzzle.complete", {
      day,
      id: puzzle.id,
      moves: solve(puzzle),
    });
  }
  call(alice, "friends.display", {
    title: "month",
    tags: ["streak", "cpu", "streak"],
  });
  call(alice, "friends.sharing", { enabled: true });
  assert.deepEqual(call(bob, "friends.status").friends[0].shared, {
    current: 30,
    display: { title: "month", tags: ["streak"] },
  });
  assert.deepEqual(call(outsider, "friends.status").friends, []);
  advance(DAY * 2);
  assert.equal(call(bob, "friends.status").friends[0].shared.current, 0);
  assert.equal(
    call(bob, "friends.status").friends[0].shared.display.title,
    "month",
  );
  call(alice, "friends.sharing", { enabled: false });
  assert.equal(call(bob, "friends.status").friends[0].shared, null);
  call(bob, "friends.remove", { id: alice.user.id });
  assert.deepEqual(call(alice, "friends.status").friends, []);
  const newInvite = call(alice, "friends.invite");
  call(bob, "friends.join", { code: newInvite.value });
  call(alice, "account.delete", { confirm: true });
  assert.deepEqual(call(bob, "friends.status").friends, []);
});

test("weekly scores replay authoritatively and only shared friend scores appear", () => {
  const { alice, bob, call, now, advance, register } = accounts();
  const week = weekNumber(dayNumber(now()));
  const child = register("Young Player", "13-17");
  assert.throws(() => call(child, "weekly.status"), /adult/);
  const a = call(alice, "weekly.status");
  assert.deepEqual(a.game, call(bob, "weekly.status").game);
  const game = cpuRun(weeklyGame(week).seed, "Starter");
  assert.throws(
    () => call(alice, "weekly.submit", { week, moves: game.moves.slice(0, 1) }),
    /Finish/,
  );
  assert.deepEqual(
    call(alice, "weekly.submit", { week, moves: game.moves, score: 999_999 }),
    { score: game.score },
  );
  assert.deepEqual(call(alice, "weekly.submit", { week, moves: [] }), {
    score: game.score,
  });
  const invite = call(alice, "friends.invite");
  call(bob, "friends.join", { code: invite.value });
  assert.deepEqual(call(bob, "weekly.status").friends, []);
  call(alice, "friends.sharing", { enabled: true });
  assert.deepEqual(call(bob, "weekly.status").friends, [
    { id: alice.user.id, alias: alice.user.alias, score: game.score },
  ]);
  advance(7 * DAY);
  assert.throws(
    () => call(bob, "weekly.submit", { week, moves: game.moves }),
    /closed/,
  );
  assert.notEqual(call(bob, "weekly.status").game.seed, a.game.seed);
});

test("CPU policies are deterministic, legal and show increasing median strength", () => {
  let previous = -1;
  for (const tier of CPU_TIERS) {
    const scores = Array.from({ length: 30 }, (_, seed) => {
      const game = cpuRun(seed, tier);
      assert.deepEqual(replay(seed, game.moves), game);
      return game.score;
    }).sort((a, b) => a - b);
    assert.deepEqual(cpuRun(80, tier), cpuRun(80, tier));
    const median = (scores[14] + scores[15]) / 2;
    assert.ok(median > previous, `${tier}: ${median} <= ${previous}`);
    previous = median;
  }
});
