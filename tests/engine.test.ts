import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  piece,
  place,
  legalMoves,
  replay,
  hint,
  colour,
  fits,
  finish,
  SHAPES,
} from "../shared/engine.ts";
function seedFor(index: number) {
  for (let s = 0; s < 10000; s++)
    if (JSON.stringify(piece(s, 0)) === JSON.stringify(SHAPES[index])) return s;
  throw Error("missing seed");
}
test("seeded sequence and cosmetic stream are reproducible", () => {
  for (let s = 0; s < 100; s++)
    for (let i = 0; i < 100; i++) {
      assert.deepEqual(piece(s, i), piece(s, i));
      assert.ok(colour(s, i) >= 1 && colour(s, i) <= 6);
    }
  assert.ok(
    new Set(Array.from({ length: 100 }, (_, i) => colour(42, i))).size === 6,
  );
});
test("three slots refill only when the entire tray is used", () => {
  let g = createGame(seedFor(0));
  const n = place(g, { slot: 0, row: 0, col: 0, seq: 0, id: "a" });
  assert.equal(n.tray[0], null);
  assert.equal(n.next, 3);
  assert.equal(g.board[0], 0);
  g = n;
  for (const slot of [1, 2]) {
    const m = legalMoves(g).find((m) => m.slot === slot)!;
    g = place(g, { ...m, seq: g.moves.length, id: String(slot) });
  }
  assert.deepEqual(g.tray, [3, 4, 5]);
});
test("rejects invalid coordinates, overlap, used slot and stale sequence without changing input", () => {
  let g = createGame(seedFor(0));
  for (const p of [
    [-1, 0],
    [0, 8],
    [0.5, 0],
  ])
    assert.throws(() =>
      place(g, { slot: 0, row: p[0], col: p[1], seq: 0, id: "x" }),
    );
  g = place(g, { slot: 0, row: 0, col: 0, seq: 0, id: "a" });
  const before = JSON.stringify(g);
  assert.throws(() => place(g, { slot: 0, row: 1, col: 1, seq: 1, id: "b" }));
  assert.throws(() => place(g, { slot: 1, row: 0, col: 0, seq: 1, id: "c" }));
  assert.throws(() => place(g, { slot: 1, row: 2, col: 2, seq: 0, id: "c" }));
  assert.equal(JSON.stringify(g), before);
});
test("simultaneous row and column clears count intersection once, score both lines", () => {
  const g = createGame(seedFor(0));
  for (let i = 1; i < 8; i++) {
    g.board[i] = 1;
    g.board[i * 8] = 2;
  }
  const n = place(g, { slot: 0, row: 0, col: 0, seq: 0, id: "cross" });
  assert.equal(n.last.cleared.length, 15);
  assert.equal(n.last.lines, 2);
  assert.equal(n.score, 410);
  assert.equal(n.cross, true);
  assert.ok(n.board.every((v) => v === 0));
});
test("combo bonus caps at nine and resets on a non-clear", () => {
  const g = createGame(seedFor(0));
  g.streak = 12;
  for (let i = 1; i < 8; i++) g.board[i] = 1;
  let n = place(g, { slot: 0, row: 0, col: 0, seq: 0, id: "line" });
  assert.equal(n.score, 335);
  const h = legalMoves(n).find((m) => m.row === 4)!;
  n = place(n, { ...h, seq: 1, id: "no-line" });
  assert.equal(n.streak, 0);
});
test("fixed move limit ends cleanly and rejects extra placements", () => {
  const g = createGame(seedFor(0), 1);
  const n = place(g, { slot: 0, row: 0, col: 0, seq: 0, id: "x" });
  assert.equal(n.done, true);
  assert.equal(n.reason, "Placement limit");
  assert.throws(() => place(n, { slot: 1, row: 3, col: 3, seq: 1, id: "y" }));
});
test("locked board has no legal moves, practice hints do not mutate", () => {
  const g = createGame(3);
  g.board.fill(1);
  assert.equal(legalMoves(g).length, 0);
  assert.equal(hint(g), undefined);
  const p = createGame(1, 3, true),
    before = JSON.stringify(p);
  assert.ok(hint(p));
  assert.equal(JSON.stringify(p), before);
});
test("replay exactly reproduces every confirmed state", () => {
  for (let seed = 1; seed <= 40; seed++) {
    let g = createGame(seed, 30);
    while (!g.done) {
      const ms = legalMoves(g);
      if (!ms.length) break;
      g = place(g, {
        ...ms[(seed + g.moves.length * 13) % ms.length],
        seq: g.moves.length,
        id: `${seed}-${g.moves.length}`,
      });
    }
    const r = replay(seed, g.moves, 30);
    assert.deepEqual(r, g);
  }
});
test("practice simple pieces, no rotation and fixed rules version", () => {
  for (let i = 0; i < 100; i++) assert.ok(piece(1, i, true).length <= 4);
  const g = createGame(5);
  g.rules = "future";
  assert.throws(
    () => place(g, { ...legalMoves(g)[0], seq: 0, id: "x" }),
    /Unsupported/,
  );
  assert.equal(finish(createGame(1)).done, true);
});
