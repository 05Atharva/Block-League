import test from "node:test";
import assert from "node:assert/strict";
import { Service } from "../server/service.ts";
import { legalMoves } from "../shared/engine.ts";
import {
  roundRobin,
  standings,
  needsDecider,
  playoffPairs,
} from "../shared/competition.ts";
function setup(size: number, family = false) {
  const s = new Service(undefined, undefined, size === 8);
  const users: any[] = [],
    teams: any[] = [];
  for (let i = 0; i < size; i++) {
    const members = Array.from({ length: 3 }, (_, j) =>
      s.dispatch("register", {
        alias: `Team${i}Player${j}`,
        age: family && i === 0 && j === 1 ? "7-12" : "18-24",
      }),
    );
    users.push(...members);
    const t = s.dispatch(
      "team.create",
      { name: `Team ${i}` },
      members[0].token,
    );
    for (const m of members.slice(1)) {
      if (m.user.age === "7-12") {
        assert.throws(
          () => s.dispatch("team.request", { code: t.code }, m.token),
          /guardian/,
        );
        s.dispatch("guardian.setup", { pin: "873529" }, m.token);
        s.dispatch("guardian.update", { pin: "873529", social: true }, m.token);
      }
      s.dispatch("team.request", { code: t.code }, m.token);
      s.dispatch(
        "team.approve",
        { id: t.id, member: m.user.id },
        members[0].token,
      );
    }
    teams.push(t);
  }
  const owner = users[0],
    l = s.dispatch(
      "league.create",
      { name: "Test season", size, windowHours: 24 },
      owner.token,
    );
  for (let i = 0; i < size; i++)
    s.dispatch(
      "league.enter",
      { code: l.code, team: teams[i].id },
      users[i * 3].token,
    );
  s.dispatch("league.start", { id: l.id }, owner.token);
  return { s, users, teams, owner, l };
}
test("Championship creation is gated while Mini League stays available", () => {
  const s = new Service();
  const { token } = s.dispatch("register", {
    alias: "Pilot organiser",
    age: "25-44",
  });
  assert.deepEqual(s.dispatch("league.formats", {}, token), [4]);
  assert.throws(
    () => s.dispatch("league.create", { name: "Championship", size: 8 }, token),
    /Championship registration is not open yet/,
  );
  assert.equal(
    s.dispatch("league.create", { name: "Mini League", size: 4 }, token).size,
    4,
  );
  const enabled = new Service(undefined, undefined, true);
  const organiser = enabled.dispatch("register", {
    alias: "Championship organiser",
    age: "25-44",
  });
  assert.deepEqual(
    enabled.dispatch("league.formats", {}, organiser.token),
    [4, 8],
  );
});
test("guardian-approved family member can enter an invited league fixture, and revocation blocks active access", () => {
  const { s, users, l } = setup(4, true);
  const child = users[1];
  const view = s.dispatch("league.get", { id: l.id }, child.token);
  assert.ok(view.myRooms.length > 0);
  const code = view.myRooms[0];
  assert.equal(s.dispatch("room.get", { code }, child.token).kind, "fixture");
  const outsider = s.dispatch("register", {
    alias: "Outside family",
    age: "25-44",
  });
  assert.throws(
    () => s.dispatch("league.get", { id: l.id }, outsider.token),
    /private/,
  );
  s.dispatch("guardian.update", { pin: "873529", social: false }, child.token);
  assert.throws(
    () => s.dispatch("room.get", { code }, child.token),
    /guardian/,
  );
});
test("new league entries require current guardian approval for the captain and their roster", () => {
  const s = new Service();
  const adult = s.dispatch("register", {
    alias: "Club organiser",
    age: "25-44",
  });
  const child = s.dispatch("register", {
    alias: "Protected member",
    age: "7-12",
  });
  const third = s.dispatch("register", { alias: "Third player", age: "25-44" });
  const pin = "612358";
  s.dispatch("guardian.setup", { pin }, child.token);
  s.dispatch("guardian.update", { pin, social: true }, child.token);
  const season = s.dispatch(
    "league.create",
    { name: "Private season", size: 4 },
    adult.token,
  );
  for (const [captain, member] of [
    [child, adult],
    [adult, child],
  ]) {
    const team = s.dispatch(
      "team.create",
      { name: "Private team" },
      captain.token,
    );
    for (const player of [member, third]) {
      s.dispatch("team.request", { code: team.code }, player.token);
      s.dispatch(
        "team.approve",
        { id: team.id, member: player.user.id },
        captain.token,
      );
    }
    s.dispatch("guardian.update", { pin, social: false }, child.token);
    assert.throws(
      () =>
        s.dispatch(
          "league.enter",
          { code: season.code, team: team.id },
          captain.token,
        ),
      /guardian/i,
    );
    assert.equal(s.db.teams[team.id].locked, false);
    assert.deepEqual(s.db.leagues[season.id].teams, []);
    s.dispatch("guardian.update", { pin, social: true }, child.token);
  }
});
test("an underfilled season expires and releases its roster, while the archived roster stays private", () => {
  let now = Date.now();
  const s = new Service(undefined, () => now);
  const roster = ["Captain", "Original A", "Original B"].map((alias) =>
    s.dispatch("register", { alias, age: "25-44" }),
  );
  const [captain, ...members] = roster;
  const create = (name: string) =>
    s.dispatch("league.create", { name, size: 4 }, captain.token);
  const initial = create("Underfilled season");
  const team = s.dispatch(
    "team.create",
    { name: "Try again team" },
    captain.token,
  );
  for (const member of members) {
    s.dispatch("team.request", { code: team.code }, member.token);
    s.dispatch(
      "team.approve",
      { id: team.id, member: member.user.id },
      captain.token,
    );
  }
  s.dispatch(
    "league.enter",
    { code: initial.code, team: team.id },
    captain.token,
  );
  now = initial.deadline;
  assert.equal(
    s.dispatch("league.get", { id: initial.id }, captain.token).status,
    "expired",
  );
  assert.throws(
    () => s.dispatch("league.start", { id: initial.id }, captain.token),
    /awaiting its first fixture/i,
  );
  const next = create("Second season");
  assert.equal(
    s.dispatch(
      "league.enter",
      { code: next.code, team: team.id },
      captain.token,
    ).teams.length,
    1,
  );
  assert.equal(
    s.dispatch("league.get", { id: initial.id }, members[0].token).status,
    "expired",
  );
});
function playRoom(
  s: Service,
  code: string,
  users: any[],
  winSeat: number | null,
) {
  let r = s.db.rooms[code];
  for (let i = 0; i < 2; i++) {
    const p = r.players[i],
      u = users.find((u) => u.user.id === p.id);
    if (i === winSeat) {
      const m = legalMoves(p.game)[0];
      s.dispatch(
        "room.move",
        { code, move: { ...m, seq: 0, id: "move-" + code } },
        u.token,
      );
    }
    s.dispatch("room.finish", { code }, u.token);
  }
}
test("round robin and playoff topology match 4 / 8 team formats", () => {
  assert.equal(roundRobin(["a", "b", "c", "d"]).length, 6);
  assert.equal(
    roundRobin(Array.from({ length: 8 }, (_, i) => String(i))).length,
    28,
  );
  assert.deepEqual(playoffPairs(["a", "b", "c", "d"]), {
    qualifier1: ["a", "b"],
    eliminator: ["c", "d"],
  });
});
test("published standings prefer head-to-head then individual duel wins", () => {
  const r = standings(
    ["a", "b", "c"],
    [
      { a: "a", b: "b", sa: 4, sb: 2, aw: 2, bw: 1 },
      { a: "b", b: "c", sa: 6, sb: 0, aw: 3, bw: 0 },
      { a: "c", b: "a", sa: 4, sb: 2, aw: 2, bw: 1 },
    ],
  );
  assert.equal(r[0].id, "b");
  assert.equal(r[0].points, 2);
  assert.equal(r[0].duelWins, 4);
  assert.equal(needsDecider(r[1], r[2]), false);
});
test("captain approval, exact roster size, duplicates, privacy and roster lock", () => {
  const { s, users, teams, l } = setup(4);
  assert.throws(
    () =>
      s.dispatch(
        "team.remove",
        { id: teams[0].id, member: users[1].user.id },
        users[0].token,
      ),
    /locked/,
  );
  const outsider = s.dispatch("register", { alias: "Outsider", age: "25-44" });
  assert.throws(
    () => s.dispatch("league.get", { id: l.id }, outsider.token),
    /private/,
  );
  assert.throws(() =>
    s.dispatch(
      "team.approve",
      { id: teams[0].id, member: outsider.user.id },
      users[3].token,
    ),
  );
});
for (const size of [4, 8])
  test(`${size}-team season advances from real validated duels to champion`, () => {
    const { s, users, teams, owner, l } = setup(size);
    let safety = 0;
    while (s.db.leagues[l.id].status !== "complete" && safety++ < 100) {
      const league = s.db.leagues[l.id];
      const open = league.fixtures.filter((f) => f.winner === undefined);
      assert.ok(open.length > 0);
      for (const f of open) {
        const ai = teams.findIndex((t) => t.id === f.a),
          bi = teams.findIndex((t) => t.id === f.b);
        for (const c of [...f.rooms])
          if (s.db.rooms[c].status !== "final")
            playRoom(s, c, users, ai < bi ? 0 : 1);
      }
      s.dispatch("league.get", { id: l.id }, owner.token);
    }
    assert.equal(s.db.leagues[l.id].status, "complete");
    assert.equal(s.db.leagues[l.id].champion, teams[0].id);
    assert.ok(s.db.users[owner.user.id].badges.includes("league-champion"));
    const phases = s.db.leagues[l.id].fixtures.map((f) => f.phase);
    assert.ok(phases.includes("final"));
    if (size === 8) {
      assert.ok(phases.includes("qualifier-1"));
      assert.ok(phases.includes("eliminator"));
      assert.ok(phases.includes("qualifier-2"));
    }
  });
test("multi-team qualification tie schedules all paired captain deciders; no hidden seeding", () => {
  const { s, users, teams, owner, l } = setup(4);
  for (const f of [...s.db.leagues[l.id].fixtures])
    for (const c of f.rooms) playRoom(s, c, users, null);
  let view = s.dispatch("league.get", { id: l.id }, owner.token);
  assert.equal(view.status, "qualification-tied");
  assert.equal(view.deciders.length, 6);
  view = s.dispatch("league.deciders", { id: l.id }, owner.token);
  assert.equal(view.status, "deciding");
  for (const f of view.fixtures.filter((f: any) =>
    f.phase.startsWith("qualification-decider"),
  )) {
    const ai = teams.findIndex((t) => t.id === f.a),
      bi = teams.findIndex((t) => t.id === f.b);
    playRoom(s, f.rooms[0], users, ai < bi ? 0 : 1);
  }
  view = s.dispatch("league.resolve", { id: l.id }, owner.token);
  assert.equal(view.status, "playing");
  assert.deepEqual(
    view.seeds,
    teams.map((t) => t.id),
  );
  assert.ok(view.fixtures.some((f: any) => f.phase === "final"));
});
test("tied knockout schedules a fresh captain decider instead of inventing a winner", () => {
  const { s, users, owner, l } = setup(4);
  const league = s.db.leagues[l.id];
  s.seedPlayoffs(league, league.teams);
  const final = league.fixtures.find((f) => f.phase === "final")!;
  for (const c of [...final.rooms]) playRoom(s, c, users, null);
  s.dispatch("league.get", { id: l.id }, owner.token);
  assert.equal(final.winner, undefined);
  assert.equal(final.rooms.length, 4);
  assert.notEqual(
    s.db.rooms[final.rooms[0]].seed,
    s.db.rooms[final.rooms[3]].seed,
  );
});
test("head-to-head subgroup paths do not collapse distinct tie groups", () => {
  const results: any[] = [];
  const win = (a: string, b: string) =>
      results.push({ a, b, sa: 6, sb: 0, aw: 3, bw: 0 }),
    draw = (a: string, b: string) =>
      results.push({ a, b, sa: 3, sb: 3, aw: 1, bw: 1 });
  draw("a", "b");
  draw("c", "d");
  for (const a of ["a", "b"]) for (const b of ["c", "d"]) win(a, b);
  for (const x of ["e", "f"]) {
    for (const y of ["a", "b"]) win(x, y);
    for (const y of ["c", "d"]) win(y, x);
    win(x, "g");
  }
  draw("e", "f");
  for (const x of ["a", "b", "c", "d"]) win("g", x);
  const table = standings(["a", "b", "c", "d", "e", "f", "g"], results),
    a = table.find((x) => x.id === "a")!,
    b = table.find((x) => x.id === "b")!,
    c = table.find((x) => x.id === "c")!,
    d = table.find((x) => x.id === "d")!;
  assert.equal(a.points, c.points);
  assert.equal(a.h2h, c.h2h);
  assert.equal(a.duelWins, c.duelWins);
  assert.equal(needsDecider(a, b), true);
  assert.equal(needsDecider(b, c), false);
  assert.equal(needsDecider(c, d), true);
});
