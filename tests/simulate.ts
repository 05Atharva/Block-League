import {
  createGame,
  legalMoves,
  place,
  replay,
  hint,
} from "../shared/engine.ts";
import { writeFileSync, mkdirSync } from "node:fs";
const runs = [];
for (let seed = 1; seed <= 500; seed++) {
  let g = createGame(seed, 30);
  while (!g.done) {
    const moves = legalMoves(g);
    const m = moves[(seed * 19 + g.moves.length * 7) % moves.length];
    if (!m) throw Error("A live game has no legal move");
    g = place(g, {
      ...m,
      seq: g.moves.length,
      id: `sim-${seed}-${g.moves.length}`,
    });
    if (g.board.some((x) => x < 0 || x > 6) || g.score < 0)
      throw Error("State invariant failed");
  }
  const check = replay(seed, g.moves, 30);
  if (JSON.stringify(check) !== JSON.stringify(g))
    throw Error("Replay mismatch");
  runs.push({ seed, moves: g.moves.length, score: g.score, reason: g.reason });
}
const report = {
  generatedAt: new Date().toISOString(),
  runs: runs.length,
  totalMoves: runs.reduce((a, r) => a + r.moves, 0),
  replayMismatches: 0,
  invalidStates: 0,
  meanScore: Math.round(runs.reduce((a, r) => a + r.score, 0) / runs.length),
  moveLimit: runs.filter((r) => r.reason === "Placement limit").length,
  lockouts: runs.filter((r) => r.reason === "No pieces fit").length,
  note: "Deterministic legal-move policy, not human usability or balance validation.",
  samples: runs.slice(0, 10),
};
mkdirSync("docs", { recursive: true });
writeFileSync("docs/simulation-results.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
