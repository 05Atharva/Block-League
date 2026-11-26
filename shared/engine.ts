/** The single rules implementation used by Expo, the server and replay verification. */
export const RULES = "block-league/1";
export type Cell = [number, number];
export const SHAPES: Cell[][] = [
  [[0, 0]],
  [
    [0, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
  [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
];
export type Move = {
  slot: number;
  row: number;
  col: number;
  seq: number;
  id: string;
};
export type Game = {
  rules: string;
  seed: number;
  beginner: boolean;
  board: number[];
  tray: (number | null)[];
  next: number;
  moves: Move[];
  score: number;
  streak: number;
  bestStreak: number;
  lines: number;
  cross: boolean;
  limit: number;
  done: boolean;
  reason: string;
  last: { cells: number[]; cleared: number[]; lines: number; gain: number };
};
export function mix(n: number): number {
  n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
  n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
  return (n ^ (n >>> 15)) >>> 0;
}
export function piece(seed: number, index: number, beginner = false): Cell[] {
  return SHAPES[
    mix(seed ^ Math.imul(index + 1, 0x9e3779b9)) %
      (beginner ? 6 : SHAPES.length)
  ];
}
export function colour(seed: number, index: number): number {
  return 1 + (mix(seed + Math.imul(index + 1, 0x85ebca6b)) % 6);
}
export function createGame(
  seed: number,
  limit = Infinity,
  beginner = false,
): Game {
  return {
    rules: RULES,
    seed: seed >>> 0,
    beginner,
    board: Array(64).fill(0),
    tray: [0, 1, 2],
    next: 3,
    moves: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    lines: 0,
    cross: false,
    limit: Number.isFinite(limit) ? limit : 1e9,
    done: false,
    reason: "",
    last: { cells: [], cleared: [], lines: 0, gain: 0 },
  };
}
export function fits(g: Game, slot: number, row: number, col: number): boolean {
  if (
    ![slot, row, col].every(Number.isInteger) ||
    slot < 0 ||
    slot > 2 ||
    row < 0 ||
    col < 0 ||
    row > 7 ||
    col > 7 ||
    g.tray[slot] == null
  )
    return false;
  return piece(g.seed, g.tray[slot]!, g.beginner).every(
    ([r, c]) => row + r < 8 && col + c < 8 && !g.board[(row + r) * 8 + col + c],
  );
}
export function legalMoves(
  g: Game,
): { slot: number; row: number; col: number }[] {
  const out = [];
  for (let s = 0; s < 3; s++)
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (fits(g, s, r, c)) out.push({ slot: s, row: r, col: c });
  return out;
}
export function place(g: Game, m: Move): Game {
  if (g.rules !== RULES) throw Error("Unsupported rules version");
  if (g.done) throw Error("This attempt is complete");
  if (m.seq !== g.moves.length)
    throw Error("Move sequence is stale. Refresh your board.");
  if (!m.id || m.id.length > 100) throw Error("Move identifier required");
  if (!fits(g, m.slot, m.row, m.col))
    throw Error("That piece does not fit here");
  const n: Game = {
    ...g,
    board: [...g.board],
    tray: [...g.tray],
    moves: [...g.moves, { ...m }],
  };
  const idx = g.tray[m.slot]!;
  const cells = piece(g.seed, idx, g.beginner).map(
    ([r, c]) => (r + m.row) * 8 + c + m.col,
  );
  cells.forEach((i) => (n.board[i] = colour(g.seed, idx)));
  const rows: number[] = [],
    cols: number[] = [];
  for (let k = 0; k < 8; k++) {
    if (n.board.slice(k * 8, k * 8 + 8).every(Boolean)) rows.push(k);
    if (Array.from({ length: 8 }, (_, r) => n.board[r * 8 + k]).every(Boolean))
      cols.push(k);
  }
  const cleared = [
    ...new Set([
      ...rows.flatMap((r) => Array.from({ length: 8 }, (_, c) => r * 8 + c)),
      ...cols.flatMap((c) => Array.from({ length: 8 }, (_, r) => r * 8 + c)),
    ]),
  ];
  cleared.forEach((i) => (n.board[i] = 0));
  const lines = rows.length + cols.length;
  n.streak = lines ? g.streak + 1 : 0;
  n.bestStreak = Math.max(n.streak, g.bestStreak);
  const gain =
    cells.length * 10 +
    100 * lines * lines +
    (lines ? 25 * Math.min(n.streak - 1, 9) : 0);
  n.score += gain;
  n.lines += lines;
  n.cross ||= rows.length > 0 && cols.length > 0;
  n.last = { cells, cleared, lines, gain };
  n.tray[m.slot] = null;
  if (n.tray.every((x) => x === null)) {
    n.tray = [n.next, n.next + 1, n.next + 2];
    n.next += 3;
  }
  if (n.moves.length >= n.limit) {
    n.done = true;
    n.reason = "Placement limit";
  } else if (!legalMoves(n).length) {
    n.done = true;
    n.reason = "No pieces fit";
  }
  return n;
}
export function finish(g: Game, reason = "Finished by player"): Game {
  return { ...g, done: true, reason };
}
export function replay(
  seed: number,
  moves: Move[],
  limit = 30,
  beginner = false,
): Game {
  return moves.reduce((g, m) => place(g, m), createGame(seed, limit, beginner));
}
export function hint(g: Game) {
  let best: ReturnType<typeof legalMoves>[number] | undefined,
    quality = -Infinity;
  for (const m of legalMoves(g)) {
    const n = place(g, { ...m, seq: g.moves.length, id: "hint" });
    // Reward clears and compact edges; this is a teaching aid, not an optimal solver.
    const q = n.last.gain + m.row * 2 + m.col - n.board.filter(Boolean).length;
    if (q > quality) {
      quality = q;
      best = m;
    }
  }
  return best;
}
export function badgeIds(g: Game, verified = false): string[] {
  return [
    g.lines > 0 ? "first-clear" : "",
    g.cross ? "cross-clear" : "",
    g.bestStreak >= 5 ? "five-clear-run" : "",
    verified && g.done && g.moves.length > 0 ? "clean-duel" : "",
  ].filter(Boolean);
}
