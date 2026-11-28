import { randomBytes } from "node:crypto";
import { adEligible } from "../shared/competition.ts";
import {
  DAY,
  dailyPuzzle,
  dayNumber,
  puzzleSolved,
  streakStats,
  verifiedDisplay,
  verifyMoves,
  weeklyGame,
  weekNumber,
} from "../shared/puzzles.ts";
import type { DisplayAwards } from "../shared/puzzles.ts";

type Player = {
  id: string;
  alias: string;
  age: string;
  social: boolean;
  sharing: boolean;
  deleted?: true;
  badges: string[];
};
type Entry = {
  days: Record<number, string>;
  assignments: Record<number, number>;
  weekly: Record<number, number>;
  friends: string[];
  code?: { value: string; expires: number };
  sharing: boolean;
  equipped: DisplayAwards;
};
export type PuzzleProgress = Record<string, Entry>;
const newEntry = (): Entry => ({
  days: {},
  assignments: {},
  weekly: {},
  friends: [],
  sharing: false,
  equipped: { title: "", tags: [] },
});
export function removePuzzlePlayer(progress: PuzzleProgress, id: string) {
  delete progress[id];
  for (const entry of Object.values(progress))
    entry.friends = entry.friends.filter((friend) => friend !== id);
}
const adult = (player?: Player) =>
  !!player &&
  !player.deleted &&
  adEligible(player.age) &&
  player.social &&
  player.sharing;
function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(message);
}
const stats = (entry: Entry, today: number) =>
  streakStats(Object.keys(entry.days).map(Number), today);
function dailyStatus(entry: Entry, today: number) {
  const summary = stats(entry, today);
  return {
    today,
    stats: summary,
    archive: Object.fromEntries(
      summary.recent.map((day) => [day, entry.days[day]]),
    ),
  };
}

export function puzzleAction(
  progress: PuzzleProgress,
  users: Record<string, Player>,
  player: Player,
  action: string,
  data: Record<string, unknown>,
  now: number,
) {
  const today = dayNumber(now);
  const week = weekNumber(today);
  const entry = progress[player.id] ?? newEntry();
  const save = () => {
    progress[player.id] = entry;
  };
  if (action === "puzzle.status") return dailyStatus(entry, today);
  if (action === "puzzle.issue") {
    const difficulty = data.difficulty;
    requireThat(
      typeof difficulty === "number" && [0, 1, 2].includes(difficulty),
      "Choose a puzzle difficulty",
    );
    if (entry.assignments[today] === undefined) {
      entry.assignments = { [today]: difficulty };
      save();
    }
    return {
      day: today,
      deadline: (today + 1) * DAY,
      credited: !!entry.days[today],
      ...dailyStatus(entry, today),
      puzzle: dailyPuzzle(player.id, today, entry.assignments[today]),
      difficulty: entry.assignments[today],
    };
  }
  if (action === "puzzle.complete") {
    requireThat(
      Number.isInteger(data.day) && Number(data.day) <= today,
      "Invalid puzzle day",
    );
    const day = Number(data.day);
    if (entry.days[day]) {
      requireThat(
        entry.days[day] === data.id,
        "That puzzle was not the credited assignment",
      );
      return { credited: true, ...dailyStatus(entry, today) };
    }
    requireThat(
      day === today,
      "The deadline passed. Your solve stays in practice.",
    );
    const difficulty = entry.assignments[today];
    requireThat(
      difficulty !== undefined,
      "Open today's puzzle before submitting a solve",
    );
    const puzzle = dailyPuzzle(player.id, today, difficulty);
    requireThat(
      puzzle.id === data.id,
      "That puzzle is different from today's assignment",
    );
    requireThat(
      puzzleSolved(puzzle, verifyMoves(puzzle.game, data.moves, puzzle)),
      "The puzzle objective is incomplete",
    );
    entry.days[today] = puzzle.id;
    save();
    return { credited: true, ...dailyStatus(entry, today) };
  }
  if (action === "weekly.status") {
    requireThat(
      adult(player),
      "Weekly Board is available to online adult profiles",
    );
    const friends = entry.friends
      .flatMap((id) => {
        const other = progress[id];
        if (
          !adult(users[id]) ||
          !other?.friends.includes(player.id) ||
          !other.sharing ||
          other.weekly[week] === undefined
        )
          return [];
        return [{ id, alias: users[id].alias, score: other.weekly[week] }];
      })
      .sort((a, b) => b.score - a.score || a.alias.localeCompare(b.alias));
    return {
      week,
      deadline: (week + 7) * DAY,
      game: weeklyGame(week),
      score: entry.weekly[week] ?? null,
      friends,
    };
  }
  if (action === "weekly.submit") {
    requireThat(
      adult(player),
      "Weekly Board is available to online adult profiles",
    );
    const submitted = data.week;
    requireThat(
      typeof submitted === "number" &&
        Number.isInteger(submitted) &&
        submitted <= week &&
        weekNumber(submitted) === submitted,
      "Invalid board week",
    );
    if (entry.weekly[submitted] !== undefined)
      return { score: entry.weekly[submitted] };
    requireThat(
      submitted === week,
      "This board has closed. Your score stays in practice.",
    );
    const game = verifyMoves(weeklyGame(week), data.moves);
    requireThat(game.done, "Finish the board before submitting");
    entry.weekly[week] = game.score;
    save();
    return { score: game.score };
  }
  requireThat(
    adult(player),
    "Friend streaks are available to online adult profiles",
  );
  if (action === "friends.status")
    return {
      sharing: entry.sharing,
      code: entry.code && entry.code.expires > now ? entry.code : null,
      friends: entry.friends.flatMap((id) => {
        const other = progress[id];
        const account = users[id];
        if (!adult(account) || !other?.friends.includes(player.id)) return [];
        const streak = stats(other, today);
        return [
          {
            id,
            alias: account.alias,
            shared: other.sharing
              ? {
                  current: streak.current,
                  display: verifiedDisplay(
                    other.equipped,
                    streak.best,
                    account.badges.includes("clean-duel"),
                  ),
                }
              : null,
          },
        ];
      }),
    };
  if (action === "friends.invite") {
    entry.code = {
      value: randomBytes(8).toString("hex").toUpperCase(),
      expires: now + DAY,
    };
    save();
    return entry.code;
  }
  if (action === "friends.join") {
    const code = String(data.code || "")
      .trim()
      .toUpperCase();
    requireThat(/^[A-F0-9]{16}$/.test(code), "Enter the full friend code");
    const friend = Object.keys(progress).find(
      (id) =>
        progress[id].code?.value === code &&
        progress[id].code!.expires > now &&
        adult(users[id]),
    );
    requireThat(
      friend && friend !== player.id,
      "Use an active code from a different adult player",
    );
    const other = progress[friend];
    requireThat(
      (entry.friends.length < 50 && other.friends.length < 50) ||
        entry.friends.includes(friend),
      "Friend list is full",
    );
    entry.friends = [...new Set([...entry.friends, friend])];
    other.friends = [...new Set([...other.friends, player.id])];
    delete other.code;
    save();
    return { alias: users[friend].alias };
  }
  if (action === "friends.remove") {
    const friend = String(data.id || "");
    if (entry.friends.includes(friend)) {
      entry.friends = entry.friends.filter((id) => id !== friend);
      progress[friend].friends = progress[friend].friends.filter(
        (id) => id !== player.id,
      );
      save();
    }
    return {};
  }
  if (action === "friends.sharing") {
    requireThat(typeof data.enabled === "boolean", "Choose whether to share");
    entry.sharing = data.enabled;
    save();
    return {};
  }
  if (action === "friends.display") {
    requireThat(
      typeof data.title === "string" && Array.isArray(data.tags),
      "Choose a title and tags",
    );
    entry.equipped = verifiedDisplay(
      { title: data.title, tags: data.tags },
      stats(entry, today).best,
      player.badges.includes("clean-duel"),
    );
    save();
    return entry.equipped;
  }
  throw Error("Unknown action");
}
