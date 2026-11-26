export const LEAGUE_NAME_LIMIT = 40;

export type Result = {
  a: string;
  b: string;
  sa: number;
  sb: number;
  aw?: number;
  bw?: number;
};
export function roundRobin(ids: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]]);
  return pairs;
}
export function standings(ids: string[], results: Result[]) {
  const rows = ids.map((id) => ({
    id,
    played: 0,
    points: 0,
    wins: 0,
    duelWins: 0,
    h2h: 0,
    tieKey: "",
  }));
  for (const r of results) {
    const a = rows.find((x) => x.id === r.a),
      b = rows.find((x) => x.id === r.b);
    if (!a || !b) continue;
    a.played++;
    b.played++;
    a.duelWins += r.aw ?? (r.sa > r.sb ? 1 : 0);
    b.duelWins += r.bw ?? (r.sb > r.sa ? 1 : 0);
    if (r.sa === r.sb) {
      a.points++;
      b.points++;
    } else {
      const w = r.sa > r.sb ? a : b;
      w.points += 2;
      w.wins++;
    }
  }
  function resolve(group: typeof rows, path: string): typeof rows {
    if (group.length < 2) {
      group.forEach((r) => (r.tieKey = path));
      return group;
    }
    const ids = group.map((x) => x.id);
    for (const row of group) {
      row.h2h = 0;
      for (const r of results)
        if (ids.includes(r.a) && ids.includes(r.b)) {
          if (r.a === row.id)
            row.h2h += r.sa > r.sb ? 2 : r.sa === r.sb ? 1 : 0;
          if (r.b === row.id)
            row.h2h += r.sb > r.sa ? 2 : r.sa === r.sb ? 1 : 0;
        }
    }
    const groups = [...new Set(group.map((x) => x.h2h))]
      .sort((a, b) => b - a)
      .map((n) => group.filter((x) => x.h2h === n));
    if (groups.length === 1) {
      group.forEach((r) => (r.tieKey = path + "/" + r.h2h + "/" + r.duelWins));
      return group.sort(
        (a, b) => b.duelWins - a.duelWins || a.id.localeCompare(b.id),
      );
    }
    return groups.flatMap((g) => resolve(g, path + "/" + g[0].h2h));
  }
  return [...new Set(rows.map((x) => x.points))]
    .sort((a, b) => b - a)
    .flatMap((points) =>
      resolve(
        rows.filter((x) => x.points === points),
        String(points),
      ),
    );
}
export function needsDecider(
  a: ReturnType<typeof standings>[number],
  b: ReturnType<typeof standings>[number],
) {
  return a.tieKey === b.tieKey;
}
export function playoffPairs(seeds: string[]) {
  if (seeds.length < 4) throw Error("Four seeds required");
  return { qualifier1: [seeds[0], seeds[1]], eliminator: [seeds[2], seeds[3]] };
}
export const REACTIONS = [
  "Nice move!",
  "Good game!",
  "Well played!",
  "You’ve got this!",
];
export function adEligible(age: string) {
  return age === "18-24" || age === "25-44" || age === "45-65" || age === "65+";
}
export const BADGES = [
  ["first-clear", "First Clear", "Clear a line."],
  ["cross-clear", "Cross Clear", "Clear a row and a column together."],
  ["five-clear-run", "Five-Clear Run", "Clear on five consecutive placements."],
  [
    "clean-duel",
    "Clean Duel",
    "Finish a server-validated competitive attempt.",
  ],
  [
    "team-contributor",
    "Team Contributor",
    "Finish all your assigned round-robin fixtures.",
  ],
  ["league-champion", "League Champion", "Win a completed private season."],
];
