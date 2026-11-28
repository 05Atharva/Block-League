import type { Game } from "../../shared/engine";
import type {
  DisplayAwards,
  Puzzle,
  Tier,
  streakStats,
} from "../../shared/puzzles";

export type PuzzleRun = {
  puzzle: Puzzle;
  game: Game;
  assisted?: boolean;
  practiceDay?: number;
};
export type DailyRun = PuzzleRun & {
  day: number;
  deadline: number;
  issued: boolean;
  credit?: "verified" | "practice";
};
export type WeeklyRun = {
  game: Game;
  week: number;
  deadline: number;
  practice: boolean;
  verified?: number;
};
export type CpuRun = {
  game: Game;
  cpu: Game;
  tier: Tier;
  policy: string;
  firstWin?: boolean;
};
export type OpenRun = {
  game: Game;
  chapters: number;
  lines: number;
  history?: { score: number; lines: number }[];
};
export type PlayProgress = {
  version: 1;
  journey: Record<string, PuzzleRun>;
  daily?: DailyRun;
  weekly?: WeeklyRun;
  weeklyPractice?: WeeklyRun;
  cpu?: CpuRun;
  open?: OpenRun;
  practice?: PuzzleRun;
  dailyArchive: Record<number, string>;
  localDaily?: number[];
  difficulty: number;
  verifiedDaily?: { day: number; stats: ReturnType<typeof streakStats> };
  equipped: DisplayAwards;
  cpuWin?: boolean;
  crossing?: boolean;
  earnedAt?: Partial<Record<"journey" | "cpu" | "crossing", number>>;
};
export const emptyProgress: PlayProgress = {
  version: 1,
  journey: {},
  dailyArchive: {},
  difficulty: 1,
  equipped: { title: "", tags: [] },
};
