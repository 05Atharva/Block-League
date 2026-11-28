import {
  createGame,
  legalMoves,
  mix,
  piece,
  place,
  SHAPES,
  validMoveId,
} from "./engine.ts";
import type { Game, Move } from "./engine.ts";

export const DAY = 86_400_000;
export const dayNumber = (at: number) => Math.floor(at / DAY);
export const weekNumber = (day: number) => day - ((((day + 3) % 7) + 7) % 7);
export const CPU_POLICY = "club-cpu/1";
export const CPU_TIERS = ["Starter", "Planner", "Architect"] as const;
export type Tier = (typeof CPU_TIERS)[number];
type Placement = Pick<Move, "slot" | "row" | "col">;
export type Puzzle = {
  id: string;
  title: string;
  brief: string;
  game: Game;
  goal: "row" | "column" | "lines" | "cross" | "tray" | "chain";
  target: number;
  solution: Placement[];
};

function hash(text: string) {
  let hash = 2166136261;
  for (const character of text)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return mix(hash);
}

function rowPuzzle(
  id: string,
  title: string,
  key: number,
  style: number,
  difficulty: number,
): Puzzle {
  let seed = key;
  const slot = key % 3;
  const row = 1 + ((key >>> 5) % 5);
  const col = 1 + ((key >>> 9) % 4);
  const wanted = [3, 4, 5, 0, 1, 3, 14, 5, 1][style];
  const other = (slot + 1) % 3;
  const third = (slot + 2) % 3;
  const chain = style === 5 || style === 8;
  while (
    piece(seed, slot) !== SHAPES[wanted] ||
    (chain && piece(seed, other) !== SHAPES[1]) ||
    (style === 8 && piece(seed, third) !== SHAPES[3])
  )
    seed = (seed + 1) >>> 0;
  const game = createGame(
    seed,
    [4, 4, 5, 5, 4, 5, 5, 5, 6][style] + (2 - difficulty),
  );
  const solution = [{ slot, row, col }];
  const fillRow = (r: number) => {
    for (let c = 0; c < 8; c++) game.board[r * 8 + c] = 1 + ((r + c + key) % 6);
  };
  const fillCol = (c: number) => {
    for (let r = 0; r < 8; r++) game.board[r * 8 + c] = 1 + ((r + c + key) % 6);
  };
  if (style === 1 || style === 7) fillCol(col);
  else fillRow(row);
  if (style === 2 || style === 6) fillRow(row + 1);
  if (style === 3) fillCol(col);
  if (style === 6) fillRow(row + 2);
  if (style === 7) fillCol(col + 1);
  if (chain) {
    const secondRow = row < 4 ? row + 3 : row - 3;
    const secondCol = 5 - col;
    fillRow(secondRow);
    game.board[secondRow * 8 + secondCol] = 0;
    game.board[secondRow * 8 + secondCol + 1] = 0;
    solution.push({ slot: other, row: secondRow, col: secondCol });
    if (style === 8) {
      const thirdRow = 7;
      const thirdCol = 2 + (key % 3);
      fillRow(thirdRow);
      for (let c = thirdCol; c < thirdCol + 3; c++)
        game.board[thirdRow * 8 + c] = 0;
      solution.push({ slot: third, row: thirdRow, col: thirdCol });
    }
  }
  for (const [r, c] of SHAPES[wanted]) game.board[(row + r) * 8 + col + c] = 0;
  if (style === 4) {
    const placeEmpty = (board: Game, move: Placement) =>
      place(board, {
        ...move,
        seq: board.moves.length,
        id: "catalogue",
      });
    let board = placeEmpty(game, solution[0]);
    for (let step = 0; step < 2; step++) {
      const candidate = legalMoves(board)[0];
      if (!candidate) throw Error("Puzzle catalogue has no tray solution");
      solution.push(candidate);
      board = placeEmpty(board, candidate);
    }
  }
  const goal = (
    [
      "row",
      "column",
      "lines",
      "cross",
      "tray",
      "chain",
      "lines",
      "lines",
      "chain",
    ] as const
  )[style];
  const target = [1, 1, 2, 1, 3, 2, 3, 2, 3][style];
  const brief = [
    "Clear a row.",
    "Clear a column.",
    "Clear two lines.",
    "Clear a row and a column in the same placement.",
    "Clear a line and place all three starting pieces.",
    "Clear lines on two consecutive placements.",
    "Clear three lines.",
    "Clear two lines.",
    "Clear lines on three consecutive placements.",
  ][style];
  return { id, title, brief, game, goal, target, solution };
}

const journeyTitles = [
  "The Long Gap",
  "Up the Wall",
  "Two Floors",
  "Crossroads",
  "Empty the Tray",
  "Keep It Going",
];
export const JOURNEY = journeyTitles.map((title, i) =>
  rowPuzzle("journey/1/" + i, title, hash(title), i, 1),
);

export const DIFFICULTIES = ["Calm", "Steady", "Sharp"];
export function dailyPuzzle(
  identity: string,
  day: number,
  difficulty: number,
): Puzzle {
  const key = hash(`daily/1/${identity}/${day}/${difficulty}`);
  return buildDailyPuzzle(day, difficulty, key);
}

export function restoreDailyPuzzle(id?: string) {
  if (typeof id !== "string") return undefined;
  const fields = /^daily\/1\/(-?\d+)\/([0-2])\/(\d+)$/.exec(id);
  if (!fields) return undefined;
  const [, day, difficulty, key] = fields;
  if (!Number.isSafeInteger(Number(day)) || Number(key) > 0xffffffff)
    return undefined;
  return buildDailyPuzzle(Number(day), Number(difficulty), Number(key));
}

function buildDailyPuzzle(day: number, difficulty: number, key: number) {
  const styles = [
    [0, 1, 2, 7],
    [2, 3, 4, 5],
    [3, 5, 6, 8],
  ][difficulty];
  const style = styles[key % styles.length];
  return rowPuzzle(
    `daily/1/${day}/${difficulty}/${key}`,
    "Daily Puzzle",
    key,
    style,
    difficulty,
  );
}

export function puzzleSolved(puzzle: Puzzle, game: Game) {
  if (puzzle.goal === "row" || puzzle.goal === "column") {
    if (!game.last.lines) return false;
    const cleared = new Set(game.last.cleared);
    for (let line = 0; line < 8; line++) {
      const cells = Array.from({ length: 8 }, (_, offset) =>
        puzzle.goal === "row" ? line * 8 + offset : offset * 8 + line,
      );
      if (cells.every((cell) => cleared.has(cell))) return true;
    }
    return false;
  }
  if (puzzle.goal === "cross") return game.cross;
  if (puzzle.goal === "tray") return game.lines >= 1 && game.next >= 6;
  if (puzzle.goal === "chain") return game.bestStreak >= puzzle.target;
  return game.lines >= puzzle.target;
}

export function verifyMoves(
  initial: Game,
  moves: unknown,
  puzzle?: Puzzle,
): Game {
  if (!Array.isArray(moves) || !moves.length || moves.length > initial.limit)
    throw Error("An eligible sequence of placements is required");
  let game = initial;
  const ids = new Set<string>();
  for (const move of moves) {
    if (
      !move ||
      !validMoveId(move.id) ||
      ids.has(move.id) ||
      (puzzle && puzzleSolved(puzzle, game))
    )
      throw Error("Invalid placement history");
    const { slot, row, col, seq, id } = move;
    game = place(game, { slot, row, col, seq, id });
    ids.add(id);
  }
  return game;
}

export function streakStats(days: number[], today: number) {
  const ordered = [...new Set(days)]
    .filter((day) => day <= today)
    .sort((a, b) => a - b);
  let run = 0;
  let best = 0;
  let previous = -Infinity;
  let seven: number | null = null;
  let thirty: number | null = null;
  for (const day of ordered) {
    run = day === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    if (run === 7 && seven === null) seven = day;
    if (run === 30 && thirty === null) thirty = day;
    previous = day;
  }
  return {
    current: previous >= today - 1 ? run : 0,
    best,
    total: ordered.length,
    recent: ordered.slice(-90),
    first: ordered[0] ?? null,
    seven,
    thirty,
  };
}

export function weeklyGame(week: number) {
  return createGame(hash("weekly/1/" + week), 30);
}

export function cpuMove(game: Game, tier: Tier): Game {
  if (game.done) return game;
  const options = legalMoves(game);
  if (!options.length) return game;
  const salt = mix(game.seed + game.moves.length);
  const apply = (move: Placement) =>
    place(game, {
      ...move,
      seq: game.moves.length,
      id: "cpu-" + game.moves.length,
    });
  if (tier === "Starter") return apply(options[salt % options.length]);
  let best = game;
  let rating = -Infinity;
  // Score only boards from legal placements. The advanced tier checks remaining tray
  // pieces for blocked slots without consulting the next deal.
  for (let i = 0; i < options.length; i++) {
    const index = (salt + i) % options.length;
    const candidate = apply(options[index]);
    let score = candidate.last.gain;
    if (tier === "Architect") {
      let edges = 0;
      for (let cell = 0; cell < 64; cell++) {
        if (!candidate.board[cell]) continue;
        edges += Number(cell % 8 === 0 || !!candidate.board[cell - 1]);
        edges += Number(cell % 8 === 7 || !!candidate.board[cell + 1]);
        edges += Number(cell < 8 || !!candidate.board[cell - 8]);
        edges += Number(cell >= 56 || !!candidate.board[cell + 8]);
      }
      score += edges * 4;
      if (candidate.next === game.next) {
        const movable = new Set(legalMoves(candidate).map((move) => move.slot));
        score -=
          candidate.tray.filter(
            (index, slot) => index !== null && !movable.has(slot),
          ).length * 1000;
      }
    }
    if (score > rating) {
      best = candidate;
      rating = score;
    }
  }
  return best;
}

export const TITLES = [
  ["journey", "Trailblazer", "Complete all six Journey boards."],
  ["week", "Week Builder", "Complete seven Daily Puzzles on consecutive days."],
  ["month", "Club Regular", "Complete 30 Daily Puzzles on consecutive days."],
] as const;
export const TAGS = [
  [
    "streak",
    "7-Day Streak",
    "Complete seven Daily Puzzles on consecutive days.",
  ],
  ["cpu", "CPU Practice", "Win your first CPU Duel."],
  ["faceoff", "Verified Face-Off", "Finish a verified Face-Off."],
] as const;
export type DisplayAwards = { title: string; tags: string[] };
export function verifiedDisplay(
  equipped: DisplayAwards,
  best: number,
  faceoff: boolean,
): DisplayAwards {
  const titleAllowed =
    (equipped.title === "week" && best >= 7) ||
    (equipped.title === "month" && best >= 30);
  return {
    title: titleAllowed ? equipped.title : "",
    tags: [...new Set(equipped.tags)]
      .filter(
        (tag) =>
          (tag === "streak" && best >= 7) || (tag === "faceoff" && faceoff),
      )
      .slice(0, 2),
  };
}
