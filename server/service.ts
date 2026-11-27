import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { dirname } from "node:path";
import {
  createGame,
  place,
  finish,
  badgeIds,
  RULES,
} from "../shared/engine.ts";
import type { Game, Move } from "../shared/engine.ts";
import {
  roundRobin,
  standings,
  needsDecider,
  REACTIONS,
  adEligible,
  LEAGUE_NAME_LIMIT,
} from "../shared/competition.ts";
const id = () => randomBytes(16).toString("hex"),
  code = () => randomBytes(4).toString("hex").toUpperCase();
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const assert = (v: unknown, msg: string) => {
  if (!v) throw Error(msg);
};
const clean = (s: unknown, max = 24) =>
  String(s || "")
    .trim()
    .replace(/[<>\x00-\x1f]/g, "")
    .slice(0, max);
const ages = ["7-12", "13-17", "18-24", "25-44", "45-65", "65+", "unknown"];
export class RoomAccessError extends Error {}
type User = {
  id: string;
  alias: string;
  age: string;
  recovery: string;
  guardian?: string;
  salt?: string;
  social: boolean;
  sharing: boolean;
  badges: string[];
  best: number;
  rewards: string[];
  private: true;
  cloud?: { revision: number; progress: any };
  reminder?: number;
  deleted?: true;
};
type Seat = { id: string; ready: boolean; game: Game; seen: number };
type Room = {
  code: string;
  seed: number;
  host: string;
  kind: "live" | "async" | "fixture";
  created: number;
  deadline: number;
  starts: number;
  status: "waiting" | "playing" | "final";
  players: Seat[];
  result?: { winner: string | null; scores: number[] };
  finishedAt?: number;
  reactions: { by: string; userId: string; text: string; at: number }[];
  fixture?: string;
};
type Team = {
  id: string;
  name: string;
  code: string;
  captain: string;
  members: string[];
  requests: string[];
  locked: boolean;
};
type Fixture = {
  id: string;
  a: string;
  b: string;
  rooms: string[];
  phase: string;
  winner?: string | null;
  points?: number[];
};
type League = {
  id: string;
  name: string;
  code: string;
  owner: string;
  size: number;
  teams: string[];
  rosters: Record<string, { captain: string; members: string[] }>;
  deadline: number;
  windowHours: number;
  status: string;
  fixtures: Fixture[];
  champion?: string;
  seeds?: string[];
  deciders?: [string, string][];
  tieGroups?: string[][];
  qualificationRound?: number;
  qualificationSeeds?: string[];
};
type DB = {
  users: Record<string, User>;
  sessions: Record<string, string>;
  rooms: Record<string, Room>;
  teams: Record<string, Team>;
  leagues: Record<string, League>;
  reports: any[];
  rewardEvents: Record<string, { user: string; state: string }>;
};
export class Service {
  db: DB;
  path?: string;
  clock: () => number;
  private championshipEnabled: boolean;
  private production: boolean;
  constructor(
    path?: string,
    clock = () => Date.now(),
    championshipEnabled = false,
    production = false,
  ) {
    this.path = path;
    this.clock = clock;
    this.championshipEnabled = championshipEnabled;
    this.production = production;
    this.db =
      path && existsSync(path)
        ? JSON.parse(readFileSync(path, "utf8"))
        : {
            users: {},
            sessions: {},
            rooms: {},
            teams: {},
            leagues: {},
            reports: [],
            rewardEvents: {},
          };
    // Editions saved before roster snapshots kept each entered team locked indefinitely.
    for (const league of Object.values(this.db.leagues))
      league.rosters ??= Object.fromEntries(
        league.teams.map((id) => {
          const team = this.db.teams[id];
          return [id, { captain: team.captain, members: [...team.members] }];
        }),
      );
  }
  save() {
    if (this.path) {
      mkdirSync(dirname(this.path), { recursive: true });
      writeFileSync(this.path + ".tmp", JSON.stringify(this.db));
      renameSync(this.path + ".tmp", this.path);
    }
  }
  publicUser(u: User) {
    const { recovery, guardian, salt, ...safe } = u;
    return { ...safe, hasGuardian: !!guardian };
  }
  me(token: string) {
    const u = this.db.users[this.db.sessions[hash(token || "")]];
    assert(u && !u.deleted, "Sign in again or recover your account");
    return u;
  }
  userByRecovery(key: unknown) {
    const candidate = typeof key === "string" ? key.trim().toLowerCase() : "";
    assert(/^[a-f0-9]{64}$/.test(candidate), "Recovery key not recognised");
    const digest = hash(candidate);
    const user = Object.values(this.db.users).find(
      (u) => !u.deleted && u.recovery === digest,
    );
    assert(user, "Recovery key not recognised");
    return user!;
  }
  deleteAccount(uid: string) {
    const previous = this.db;
    this.db = structuredClone(previous);
    try {
      this.db.users[uid] = {
        id: uid,
        alias: "Deleted player",
        age: "unknown",
        recovery: "",
        social: false,
        sharing: false,
        badges: [],
        best: 0,
        rewards: [],
        private: true,
        deleted: true,
      };
      for (const [session, owner] of Object.entries(this.db.sessions))
        if (owner === uid) delete this.db.sessions[session];
      for (const [key, offer] of Object.entries(this.db.rewardEvents))
        if (offer.user === uid) delete this.db.rewardEvents[key];
      this.db.reports = this.db.reports.filter((report) => report.by !== uid);
      for (const room of Object.values(this.db.rooms)) {
        room.reactions = room.reactions.filter(
          (reaction) => reaction.userId !== uid,
        );
        const seat = room.players.find((p) => p.id === uid);
        if (!seat || room.status === "final") continue;
        if (room.status === "waiting") {
          for (const player of room.players)
            player.game = finish(player.game, "Room closed");
          room.status = "final";
          room.finishedAt = this.clock();
          room.result = {
            winner: null,
            scores: room.players.map((p) => p.game.score),
          };
        } else if (!seat.game.done) {
          seat.game = finish(seat.game, "Account deleted");
          this.settle(room);
        }
      }
      for (const team of Object.values(this.db.teams)) {
        team.requests = team.requests.filter((id) => id !== uid);
        team.members = team.members.filter((id) => id !== uid);
        if (team.captain === uid && team.members.length)
          team.captain = team.members[0];
      }
      for (const league of Object.values(this.db.leagues)) {
        if (
          league.owner !== uid ||
          ["complete", "expired", "cancelled"].includes(league.status)
        )
          continue;
        const rosters = Object.values(league.rosters);
        const next = [
          ...rosters.map((roster) => roster.captain),
          ...rosters.flatMap((roster) => roster.members),
        ].find((id) => !this.db.users[id].deleted);
        if (next) league.owner = next;
        else league.status = "cancelled";
      }
      this.tick();
      this.save();
      return { deleted: true };
    } catch (error) {
      this.db = previous;
      throw error;
    }
  }
  social(u: User) {
    assert(u.age !== "unknown", "Choose an age group before online play");
    assert(
      !this.production || u.age !== "7-12",
      "Protected profiles play offline in this release",
    );
    assert(
      u.age !== "7-12" || u.social,
      "A guardian must enable private social play",
    );
  }
  pin(u: User, pin: string) {
    assert(u.guardian && u.salt, "Set a guardian PIN first");
    assert(
      typeof pin === "string" && /^\d{6}$/.test(pin),
      "Enter the six-digit guardian PIN",
    );
    assert(
      timingSafeEqual(
        Buffer.from(u.guardian!, "hex"),
        scryptSync(pin, u.salt!, 32),
      ),
      "Guardian PIN is incorrect",
    );
  }
  room(u: User, c: string) {
    const r = this.db.rooms[c];
    if (!r) throw new RoomAccessError("Room not found or code expired");
    if (!r.players.some((p) => p.id === u.id))
      throw new RoomAccessError("This room is private");
    if (
      r.status !== "final" &&
      u.age === "7-12" &&
      (this.production || !u.social)
    )
      throw new RoomAccessError("A guardian must enable private social play");
    return r;
  }
  waitingRoom(u: User, invite: unknown) {
    const r = this.db.rooms[String(invite).trim().toUpperCase()];
    assert(
      r && r.deadline > this.clock() && r.status === "waiting",
      "Room code expired, started or not found",
    );
    assert(
      r.players.length < 2 || r.players.some((seat) => seat.id === u.id),
      "Room is full",
    );
    return r;
  }
  settle(r: Room) {
    if (r.status === "final") return;
    if (r.players.length === 2 && r.players.every((p) => p.game.done)) {
      r.status = "final";
      r.finishedAt = this.clock();
      const [a, b] = r.players;
      r.result = {
        winner:
          a.game.score === b.game.score
            ? null
            : a.game.score > b.game.score
              ? a.id
              : b.id,
        scores: [a.game.score, b.game.score],
      };
      for (const p of r.players) {
        const u = this.db.users[p.id];
        if (u.deleted) continue;
        u.best = Math.max(u.best, p.game.score);
        u.badges = [...new Set([...u.badges, ...badgeIds(p.game, true)])];
      }
    }
  }
  tick() {
    const now = this.clock();
    for (const r of Object.values(this.db.rooms)) {
      if (r.status === "final") continue;
      if (r.deadline <= now) {
        for (const p of r.players)
          if (!p.game.done) p.game = finish(p.game, "Match window ended");
        if (r.players.length === 2) this.settle(r);
        else {
          r.status = "final";
          r.finishedAt = now;
          r.result = {
            winner: null,
            scores: r.players.map((p) => p.game.score),
          };
        }
      } else if (r.kind === "live" && r.status === "playing") {
        for (const p of r.players)
          if (!p.game.done && now - p.seen > 60000)
            p.game = finish(p.game, "Reconnect grace expired");
        this.settle(r);
      }
    }
    const lockedTeams = new Set<string>();
    for (const l of Object.values(this.db.leagues)) {
      if (l.status === "playing" || l.status === "deciding") this.advance(l);
      if (
        l.status === "registration" &&
        l.deadline <= now &&
        l.teams.length < l.size
      )
        l.status = "expired";
      if (
        l.status !== "complete" &&
        l.status !== "expired" &&
        l.status !== "cancelled"
      )
        for (const team of l.teams) lockedTeams.add(team);
    }
    for (const team of Object.values(this.db.teams))
      team.locked = lockedTeams.has(team.id);
  }
  snapshot(u: User, r: Room) {
    const own = r.players.find((p) => p.id === u.id)!;
    own.seen = this.clock();
    return {
      code: r.code,
      kind: r.kind,
      host: r.host,
      status: r.status,
      deadline: r.deadline,
      starts: r.starts,
      rules: RULES,
      game: own.game,
      players: r.players.map((p) => ({
        id: p.id,
        alias: this.db.users[p.id].alias,
        ready: p.ready,
        score: p.game.score,
        moves: p.game.moves.length,
        done: p.game.done,
        connected: this.clock() - p.seen < 6000,
      })),
      result: r.result,
      reactions: r.reactions.slice(-5),
      replays:
        r.status === "final"
          ? r.players.map((p) => ({
              alias: this.db.users[p.id].alias,
              game: p.game,
            }))
          : undefined,
    };
  }
  makeRoom(
    host: string,
    kind: Room["kind"],
    other?: string,
    deadline?: number,
    starts?: number,
  ) {
    const now = this.clock();
    let c = code();
    while (this.db.rooms[c]) c = code();
    const seed = randomBytes(4).readUInt32BE();
    const r: Room = {
      code: c,
      host,
      kind,
      seed,
      created: now,
      starts: starts || now,
      deadline: deadline || now + (kind === "live" ? 900000 : 86400000),
      status: kind === "fixture" ? "playing" : "waiting",
      players: [host, ...(other ? [other] : [])].map((uid) => ({
        id: uid,
        ready: kind === "fixture",
        game: createGame(seed, 30),
        seen: now,
      })),
      reactions: [],
    };
    this.db.rooms[c] = r;
    if (kind === "fixture") {
      for (const seat of r.players)
        if (this.db.users[seat.id].deleted)
          seat.game = finish(seat.game, "Account deleted");
      this.settle(r);
    }
    return r;
  }
  fixture(l: League, a: string, b: string, phase: string) {
    const ta = l.rosters[a],
      tb = l.rosters[b];
    const start = this.clock();
    const f: Fixture = { id: id(), a, b, phase, rooms: [] };
    const players =
      phase === "decider" || phase.startsWith("qualification-decider") ? 1 : 3;
    for (let i = 0; i < players; i++) {
      const r = this.makeRoom(
        players === 1 ? this.deciderSeat(ta) : ta.members[i],
        "fixture",
        players === 1 ? this.deciderSeat(tb) : tb.members[i],
        start + l.windowHours * 3600000,
        start,
      );
      r.fixture = f.id;
      f.rooms.push(r.code);
    }
    l.fixtures.push(f);
    return f;
  }
  deciderSeat(roster: League["rosters"][string]) {
    return (
      [roster.captain, ...roster.members].find(
        (uid) => !this.db.users[uid].deleted,
      ) ?? roster.captain
    );
  }
  advance(l: League) {
    for (const f of l.fixtures) {
      if (f.winner !== undefined) continue;
      const rooms = f.rooms.map((c) => this.db.rooms[c]);
      if (!rooms.every((r) => r.status === "final")) continue;
      const pts = [0, 0];
      for (const r of rooms) {
        const [a, b] = r.players;
        if (a.game.score === b.game.score) {
          pts[0]++;
          pts[1]++;
        } else pts[a.game.score > b.game.score ? 0 : 1] += 2;
      }
      f.points = pts;
      if (pts[0] === pts[1] && f.phase !== "round-robin") {
        // A tied knockout gets another captain duel, under a fresh seed.
        const captainA = this.deciderSeat(l.rosters[f.a]);
        const captainB = this.deciderSeat(l.rosters[f.b]);
        if (
          this.db.users[captainA].deleted &&
          this.db.users[captainB].deleted
        ) {
          l.status = "cancelled";
          return;
        }
        const r = this.makeRoom(
          captainA,
          "fixture",
          captainB,
          this.clock() + l.windowHours * 3600000,
        );
        r.fixture = f.id;
        f.rooms.push(r.code);
        continue;
      }
      f.winner = pts[0] === pts[1] ? null : pts[0] > pts[1] ? f.a : f.b;
    }
    if (l.status === "deciding") return;
    const rr = l.fixtures.filter((f) => f.phase === "round-robin");
    if (!rr.length || rr.some((f) => f.winner === undefined)) return;
    if (!l.seeds) {
      const rows = this.table(l);
      const groups: string[][] = [];
      for (let i = 0; i < rows.length;) {
        let j = i + 1;
        while (j < rows.length && needsDecider(rows[i], rows[j])) j++;
        if (j - i > 1 && i < (l.size === 8 ? 4 : 2))
          groups.push(rows.slice(i, j).map((r) => r.id));
        i = j;
      }
      if (groups.length) {
        l.status = "qualification-tied";
        l.tieGroups = groups;
        l.deciders = groups.flatMap(roundRobin);
        l.qualificationSeeds = rows.map((r) => r.id);
        return;
      }
      this.seedPlayoffs(
        l,
        rows.map((r) => r.id),
      );
    }
    const phase = (p: string) => l.fixtures.find((f) => f.phase === p);
    if (l.size === 8) {
      const q = phase("qualifier-1"),
        e = phase("eliminator");
      if (q?.winner && e?.winner && !phase("qualifier-2"))
        this.fixture(l, q.winner === q.a ? q.b : q.a, e.winner, "qualifier-2");
      const q2 = phase("qualifier-2");
      if (q?.winner && q2?.winner && !phase("final"))
        this.fixture(l, q.winner, q2.winner, "final");
    }
    const final = phase("final");
    if (final?.winner) {
      l.status = "complete";
      l.champion = final.winner;
      for (const uid of l.rosters[final.winner].members) {
        const u = this.db.users[uid];
        if (u.deleted) continue;
        u.badges = [...new Set([...u.badges, "league-champion"])];
      }
    }
    for (const t of l.teams)
      for (const uid of l.rosters[t].members) {
        if (this.db.users[uid].deleted) continue;
        const assigned = rr
          .flatMap((f) => f.rooms)
          .map((c) => this.db.rooms[c])
          .filter((r) => r.players.some((p) => p.id === uid));
        if (
          assigned.length &&
          assigned.every(
            (r) =>
              r.status === "final" &&
              r.players.find((p) => p.id === uid)!.game.moves.length > 0,
          )
        ) {
          const u = this.db.users[uid];
          u.badges = [...new Set([...u.badges, "team-contributor"])];
        }
      }
  }
  table(l: League) {
    return standings(
      l.teams,
      l.fixtures
        .filter((f) => f.phase === "round-robin" && f.winner !== undefined)
        .map((f) => ({
          a: f.a,
          b: f.b,
          sa: f.points![0],
          sb: f.points![1],
          aw: f.rooms.filter((c) => {
            const r = this.db.rooms[c];
            return r.result?.winner === r.players[0].id;
          }).length,
          bw: f.rooms.filter((c) => {
            const r = this.db.rooms[c];
            return r.result?.winner === r.players[1].id;
          }).length,
        })),
    );
  }
  seedPlayoffs(l: League, seeds: string[]) {
    l.seeds = seeds;
    l.status = "playing";
    if (l.size === 4) this.fixture(l, seeds[0], seeds[1], "final");
    else {
      this.fixture(l, seeds[0], seeds[1], "qualifier-1");
      this.fixture(l, seeds[2], seeds[3], "eliminator");
    }
  }
  leagueView(u: User, l: League) {
    assert(
      l &&
        (l.owner === u.id ||
          l.teams.some((t) => l.rosters[t].members.includes(u.id))),
      "This league is private",
    );
    const { rosters, ...season } = l;
    return {
      ...season,
      teamNames: Object.fromEntries(
        l.teams.map((t) => [t, this.db.teams[t].name]),
      ),
      standings: this.table(l),
      myRooms: l.fixtures
        .flatMap((f) => f.rooms)
        .filter((c) => this.db.rooms[c].players.some((p) => p.id === u.id)),
    };
  }
  dispatch(action: string, d: any = {}, token = ""): any {
    this.tick();
    let out: any;
    if (action === "register") {
      assert(ages.includes(d.age), "Choose an age group");
      assert(
        !this.production || d.age !== "7-12",
        "Protected profiles play offline in this release",
      );
      assert(clean(d.alias).length >= 2, "Use an alias of 2–24 characters");
      const uid = id(),
        recovery = id() + id(),
        session = id() + id();
      const u: User = {
        id: uid,
        alias: clean(d.alias),
        age: d.age,
        recovery: hash(recovery),
        social: d.age !== "7-12" && d.age !== "unknown",
        sharing: d.age !== "7-12" && d.age !== "unknown",
        badges: [],
        best: 0,
        rewards: [],
        private: true,
      };
      this.db.users[uid] = u;
      this.db.sessions[hash(session)] = uid;
      out = { token: session, recovery, user: this.publicUser(u) };
    } else if (action === "recover") {
      const u = this.userByRecovery(d.recovery);
      const session = id() + id();
      this.db.sessions[hash(session)] = u.id;
      out = { token: session, user: this.publicUser(u) };
    } else {
      const u = this.me(token);
      switch (action) {
        case "me":
          out = this.publicUser(u);
          break;
        case "account.delete":
          assert(d.confirm === true, "Confirm permanent deletion");
          return this.deleteAccount(u.id);
        case "progress.sync":
          {
            assert(
              d.progress && typeof d.progress === "object",
              "Progress required",
            );
            const current = u.cloud?.revision || 0;
            assert(
              d.revision === current,
              "Cloud progress changed on another device. Recover this account into a new local profile before syncing.",
            );
            const p = d.progress;
            assert(
              Number.isInteger(p.best) &&
                p.best >= 0 &&
                Number.isInteger(p.stars) &&
                p.stars >= 0,
              "Invalid local progress",
            );
            assert(
              !p.saved ||
                (p.saved.rules === RULES &&
                  Array.isArray(p.saved.board) &&
                  p.saved.board.length === 64),
              "Invalid saved board",
            );
            u.cloud = {
              revision: current + 1,
              progress: {
                best: p.best,
                practiceBest: Number(p.practiceBest) || 0,
                stars: p.stars,
                settings: p.settings,
                saved: p.saved || null,
                history: Array.isArray(p.history) ? p.history.slice(-40) : [],
                badges: Array.isArray(p.badges)
                  ? p.badges.filter((b: string) =>
                      ["first-clear", "cross-clear", "five-clear-run"].includes(
                        b,
                      ),
                    )
                  : [],
              },
            };
            out = { revision: current + 1 };
          }
          break;
        case "guardian.setup":
          assert(u.age === "7-12", "Guardian settings are for child accounts");
          assert(!u.guardian, "Guardian PIN already set");
          assert(/^\d{6}$/.test(d.pin), "Use a six-digit PIN");
          u.salt = id();
          u.guardian = scryptSync(d.pin, u.salt, 32).toString("hex");
          out = this.publicUser(u);
          break;
        case "guardian.update":
          this.pin(u, d.pin);
          u.social = !!d.social;
          u.sharing = !!d.sharing;
          if ([0, 10, 20, 30].includes(d.reminder)) u.reminder = d.reminder;
          out = this.publicUser(u);
          break;
        case "room.create":
          this.social(u);
          {
            const r = this.makeRoom(
              u.id,
              d.kind === "async" ? "async" : "live",
            );
            out = this.snapshot(u, r);
          }
          break;
        case "room.preview":
          this.social(u);
          {
            const r = this.waitingRoom(u, d.code);
            out = {
              code: r.code,
              kind: r.kind,
              expiresAt: r.deadline,
              placements: r.players[0].game.limit,
            };
          }
          break;
        case "room.join":
          this.social(u);
          {
            const r = this.waitingRoom(u, d.code);
            if (!r.players.some((p) => p.id === u.id)) {
              r.players.push({
                id: u.id,
                ready: false,
                game: createGame(r.seed, 30),
                seen: this.clock(),
              });
            }
            out = this.snapshot(u, r);
          }
          break;
        case "room.get":
          {
            const r = this.room(u, d.code);
            out = this.snapshot(u, r);
          }
          break;
        case "room.remove":
          {
            const r = this.room(u, d.code);
            assert(
              r.host === u.id && r.status === "waiting",
              "Only the host can remove an unstarted seat",
            );
            r.players = r.players.filter((p) => p.id === u.id);
            out = this.snapshot(u, r);
          }
          break;
        case "room.ready":
          {
            const r = this.room(u, d.code);
            assert(r.status === "waiting", "Match has already started");
            r.players.find((p) => p.id === u.id)!.ready = true;
            if (
              r.players.length === 2 &&
              (r.kind === "async" || r.players.every((p) => p.ready))
            ) {
              r.status = "playing";
              r.starts = this.clock();
              r.deadline =
                this.clock() + (r.kind === "live" ? 900000 : 86400000);
              r.players.forEach((p) => (p.seen = this.clock()));
            }
            out = this.snapshot(u, r);
          }
          break;
        case "room.move": {
          const r = this.room(u, d.code),
            p = r.players.find((p) => p.id === u.id)!;
          const old = p.game.moves.find((m) => m.id === d.move?.id);
          if (old) {
            assert(
              old.slot === d.move.slot &&
                old.row === d.move.row &&
                old.col === d.move.col &&
                old.seq === d.move.seq,
              "Action ID already used with a different move",
            );
            out = this.snapshot(u, r);
            break;
          }
          assert(
            r.status === "playing" && this.clock() >= r.starts,
            "Match is not accepting moves",
          );
          assert(
            !d.undo && !d.reroll && !d.revive && !d.booster,
            "Competitive tools are disabled",
          );
          p.game = place(p.game, d.move as Move);
          p.seen = this.clock();
          this.settle(r);
          out = this.snapshot(u, r);
          break;
        }
        case "room.finish":
          {
            const r = this.room(u, d.code);
            assert(r.status === "playing", "Match is not playing");
            const p = r.players.find((p) => p.id === u.id)!;
            p.game = finish(p.game);
            this.settle(r);
            out = this.snapshot(u, r);
          }
          break;
        case "room.submitAsync": {
          this.social(u);
          const r = this.room(u, d.code);
          const p = r.players.find((seat) => seat.id === u.id)!;
          assert(
            r.kind === "async",
            "Offline submission is only available for private async challenges",
          );
          assert(
            Array.isArray(d.moves) && d.moves.length <= 30,
            "Invalid offline moves",
          );
          assert(typeof d.finish === "boolean", "Invalid offline finish flag");
          let game = p.game;
          const open =
            r.status === "playing" &&
            this.clock() >= r.starts &&
            this.clock() < r.deadline;
          for (const move of d.moves as Move[]) {
            assert(move && typeof move === "object", "Invalid offline move");
            const previous = game.moves.find((entry) => entry.id === move.id);
            if (previous) {
              assert(
                previous.seq === move.seq &&
                  previous.slot === move.slot &&
                  previous.row === move.row &&
                  previous.col === move.col,
                "Action ID already used with a different move",
              );
              continue;
            }
            assert(open, "This challenge is no longer accepting offline moves");
            game = place(game, move);
          }
          if (d.finish && !game.done) {
            assert(open, "This challenge is no longer accepting offline moves");
            game = finish(game);
          }
          p.game = game;
          this.settle(r);
          out = this.snapshot(u, r);
          break;
        }
        case "room.react":
          {
            const r = this.room(u, d.code);
            assert(REACTIONS.includes(d.text), "Use a preset reaction");
            assert(
              !r.reactions.some(
                (x) => x.userId === u.id && this.clock() - x.at < 2000,
              ),
              "Please wait before reacting again",
            );
            r.reactions.push({
              by: u.alias,
              userId: u.id,
              text: d.text,
              at: this.clock(),
            });
            r.reactions = r.reactions.slice(-20);
            out = this.snapshot(u, r);
          }
          break;
        case "room.rematch":
          {
            const r = this.room(u, d.code);
            assert(r.status === "final", "Finish this match first");
            this.social(u);
            out = this.snapshot(
              u,
              this.makeRoom(u.id, r.kind === "async" ? "async" : "live"),
            );
          }
          break;
        case "rooms":
          out = Object.values(this.db.rooms)
            .filter((r) => r.players.some((p) => p.id === u.id))
            .slice(-30)
            .reverse()
            .map((r) => ({
              code: r.code,
              status: r.status,
              kind: r.kind,
              deadline: r.deadline,
              finishedAt: r.finishedAt,
              ownDone: r.players.some(
                (seat) => seat.id === u.id && seat.game.done,
              ),
            }));
          break;
        case "team.create":
          this.social(u);
          assert(clean(d.name).length >= 2, "Enter a team name");
          {
            const t: Team = {
              id: id(),
              name: clean(d.name),
              code: code(),
              captain: u.id,
              members: [u.id],
              requests: [],
              locked: false,
            };
            this.db.teams[t.id] = t;
            out = t;
          }
          break;
        case "team.request":
          this.social(u);
          {
            const t = Object.values(this.db.teams).find(
              (t) => t.code === String(d.code).toUpperCase(),
            );
            assert(
              t && t.members.length && !t.locked,
              "Team code invalid or roster locked",
            );
            if (!t!.members.includes(u.id) && !t!.requests.includes(u.id))
              t!.requests.push(u.id);
            out = {
              message: "Request sent. Your captain approves the roster.",
            };
          }
          break;
        case "team.approve":
          {
            const t = this.db.teams[d.id];
            assert(
              t && t.captain === u.id && !t.locked,
              "Only the captain can edit an unlocked roster",
            );
            assert(
              t.requests.includes(d.member) && t.members.length < 3,
              "Request missing or roster full",
            );
            t.requests = t.requests.filter((x) => x !== d.member);
            t.members.push(d.member);
            out = t;
          }
          break;
        case "team.remove":
          {
            const t = this.db.teams[d.id];
            assert(
              t && t.captain === u.id && !t.locked,
              "Roster is locked or you are not captain",
            );
            assert(d.member !== u.id, "Captain must stay in roster");
            t.members = t.members.filter((x) => x !== d.member);
            t.requests = t.requests.filter((x) => x !== d.member);
            out = t;
          }
          break;
        case "teams":
          out = Object.values(this.db.teams)
            .filter((t) => t.members.includes(u.id))
            .map((t) => ({
              ...t,
              people: Object.fromEntries(
                [...t.members, ...t.requests].map((uid) => [
                  uid,
                  this.db.users[uid].alias,
                ]),
              ),
            }));
          break;
        case "league.formats":
          out = this.championshipEnabled ? [4, 8] : [4];
          break;
        case "league.create":
          this.social(u);
          assert([4, 8].includes(d.size), "Choose four or eight teams");
          assert(
            d.size === 4 || this.championshipEnabled,
            "Championship registration is not open yet",
          );
          {
            const name = clean(d.name, LEAGUE_NAME_LIMIT + 1);
            assert(name.length >= 2, "Enter a league name");
            assert(name.length <= LEAGUE_NAME_LIMIT, "Season name is too long");
            const l: League = {
              id: id(),
              name,
              code: code(),
              owner: u.id,
              size: d.size,
              teams: [],
              rosters: {},
              deadline: this.clock() + 7 * 86400000,
              windowHours: Math.min(
                168,
                Math.max(1, Number(d.windowHours) || 24),
              ),
              status: "registration",
              fixtures: [],
            };
            this.db.leagues[l.id] = l;
            out = this.leagueView(u, l);
          }
          break;
        case "league.enter":
          {
            const l = Object.values(this.db.leagues).find(
                (l) => l.code === String(d.code).toUpperCase(),
              ),
              t = this.db.teams[d.team];
            assert(l && t, "League or team not found");
            assert(
              l!.status === "registration" && l!.deadline > this.clock(),
              "Registration is closed",
            );
            assert(
              t.captain === u.id && t.members.length === 3 && !t.locked,
              "Captain needs three approved players and an unlocked roster",
            );
            assert(
              l!.teams.length < l!.size && !l!.teams.includes(t.id),
              "League is full or team already entered",
            );
            assert(
              !l!.teams.some((tid) =>
                l!.rosters[tid].members.some((uid) => t.members.includes(uid)),
              ),
              "A player may only represent one team per league",
            );
            l!.teams.push(t.id);
            l!.rosters[t.id] = { captain: t.captain, members: [...t.members] };
            t.locked = true;
            out = this.leagueView(u, l!);
          }
          break;
        case "league.start":
          {
            const l = this.db.leagues[d.id];
            assert(
              l && l.owner === u.id && l.status === "registration",
              "The organiser can only start a season awaiting its first fixture",
            );
            assert(l.teams.length === l.size, "Fill all team slots first");
            l.status = "playing";
            for (const [a, b] of roundRobin(l.teams))
              this.fixture(l, a, b, "round-robin");
            out = this.leagueView(u, l);
          }
          break;
        case "league.get":
          out = this.leagueView(u, this.db.leagues[d.id]);
          break;
        case "leagues":
          out = Object.values(this.db.leagues)
            .filter(
              (l) =>
                l.owner === u.id ||
                l.teams.some((t) => l.rosters[t].members.includes(u.id)),
            )
            .map((l) => this.leagueView(u, l));
          break;
        case "league.deciders":
          {
            const l = this.db.leagues[d.id];
            assert(
              l && l.owner === u.id && l.status === "qualification-tied",
              "No qualification tie to resolve",
            );
            l.qualificationRound = (l.qualificationRound || 0) + 1;
            for (const [a, b] of l.deciders || [])
              this.fixture(
                l,
                a,
                b,
                "qualification-decider-" + l.qualificationRound,
              );
            l.status = "deciding";
            out = this.leagueView(u, l);
          }
          break;
        case "league.resolve":
          {
            const l = this.db.leagues[d.id];
            assert(
              l && l.owner === u.id && l.status === "deciding",
              "No deciders awaiting resolution",
            );
            const ds = l.fixtures.filter(
              (f) =>
                f.phase === "qualification-decider-" + l.qualificationRound,
            );
            assert(
              ds.length && ds.every((f) => f.winner),
              "Deciders are not complete",
            );
            const seeds = [...l.qualificationSeeds!],
              unresolved: string[][] = [];
            for (const group of l.tieGroups!) {
              const wins = Object.fromEntries(
                group.map((t) => [t, ds.filter((f) => f.winner === t).length]),
              );
              const sorted = [...group].sort((a, b) => wins[b] - wins[a]);
              const slots = group
                .map((t) => seeds.indexOf(t))
                .sort((a, b) => a - b);
              slots.forEach((slot, i) => (seeds[slot] = sorted[i]));
              for (const count of new Set(Object.values(wins))) {
                const tied = group.filter((t) => wins[t] === count);
                if (tied.length > 1) unresolved.push(tied);
              }
            }
            l.qualificationSeeds = seeds;
            if (unresolved.length) {
              l.status = "qualification-tied";
              l.tieGroups = unresolved;
              l.deciders = unresolved.flatMap(roundRobin);
            } else this.seedPlayoffs(l, seeds);
            out = this.leagueView(u, l);
          }
          break;
        case "report":
          {
            assert(["room", "team"].includes(d.kind), "Choose room or team");
            if (d.kind === "room") this.room(u, d.target);
            else {
              const t = this.db.teams[d.target];
              assert(
                t && t.members.includes(u.id),
                "Report a team you belong to",
              );
            }
            assert(clean(d.reason, 500).length >= 5, "Give a brief reason");
            assert(
              !this.db.reports.some(
                (r) => r.by === u.id && this.clock() - r.at < 60000,
              ),
              "One report per minute",
            );
            out = {
              id: id(),
              by: u.id,
              target: d.target,
              kind: d.kind,
              reason: clean(d.reason, 500),
              at: this.clock(),
              status: "open",
            };
            this.db.reports.push(out);
          }
          break;
        case "reward.offer":
          assert(!this.production, "Cosmetic test offers are unavailable");
          assert(
            adEligible(u.age),
            "Ad offers are for eligible adult profiles only",
          );
          {
            const offer = id();
            this.db.rewardEvents[offer] = { user: u.id, state: "offered" };
            out = {
              offer,
              reward: "Aurora cosmetic preview",
              provider: "development-simulator",
              message:
                "No real ad will load. This tests the reward lifecycle only.",
            };
          }
          break;
        case "reward.complete":
          assert(
            !this.production && process.env.ALLOW_TEST_REWARDS === "1",
            "Live reward verification is not configured",
          );
          {
            const e = this.db.rewardEvents[d.offer];
            assert(e && e.user === u.id, "Offer not found");
            assert(
              d.outcome === "completed" ||
                d.outcome === "skipped" ||
                d.outcome === "failed",
              "Invalid outcome",
            );
            if (e.state === "offered") {
              e.state = d.outcome;
              if (d.outcome === "completed")
                u.rewards = [...new Set([...u.rewards, "aurora"])];
            }
            out = { state: e.state, rewards: u.rewards, simulated: true };
          }
          break;
        case "purchase.restore":
          out = {
            available: false,
            message:
              "Store billing is not configured. No payment has been taken. Automatic ads are absent in this development build.",
          };
          break;
        default:
          throw Error("Unknown action");
      }
    }
    this.save();
    return out;
  }
}
