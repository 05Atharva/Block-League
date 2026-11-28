import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import {
  createGame,
  hint,
  legalMoves,
  place,
  replay,
} from "../shared/engine.ts";
import { startServer } from "../server/index.ts";

const captures = mkdtempSync(join(tmpdir(), "block-league-release-qa-"));
const { server, service } = startServer({
  port: 0,
  file: "",
  championshipEnabled: true,
});
await once(server, "listening");
const base = "http://127.0.0.1:" + server.address().port;
let browser;
const phonePages = [];
const runtimeErrors = [];

async function request(actor, action, data = {}) {
  const response = await fetch(base + "/api", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + (actor?.token || ""),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, data }),
  });
  return response.json();
}

async function call(actor, action, data) {
  const result = await request(actor, action, data);
  assert.equal(result.ok, true, action + ": " + result.error);
  return result.result;
}

async function reject(actor, action, data, reason) {
  const result = await request(actor, action, data);
  assert.equal(result.ok, false, action);
  assert.match(result.error, reason);
}

const button = (page, name) => page.getByRole("button", { name, exact: true });
const shown = (page, value) => page.getByText(value, { exact: true }).waitFor();
const state = (page) =>
  page.evaluate(() => {
    const local = JSON.parse(localStorage.getItem("block-league-v3"));
    return local?.profiles.find((profile) => profile.id === local.active);
  });
const waitSavedMove = (page, count) =>
  page.waitForFunction((expected) => {
    const local = JSON.parse(localStorage.getItem("block-league-v3"));
    return (
      local?.profiles.find((profile) => profile.id === local.active)?.saved
        ?.moves.length === expected
    );
  }, count);

async function phone(alias, age = "25-44") {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  phonePages.push(page);
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto(base);
  await page.getByLabel("Choose an alias").fill(alias);
  await button(page, age).tap();
  await button(page, "Let’s play").tap();
  await page.getByTestId("play-solo").waitFor();
  return page;
}

async function screenshot(page, filename) {
  await page.screenshot({ path: join(captures, filename) });
}

async function placeByTouch(page, move) {
  await page.getByTestId("piece-" + move.slot).tap();
  await page.getByTestId("cell-" + move.row + "-" + move.col).tap();
  await page.getByTestId("confirm-place").tap();
}

async function finishByTouch(page) {
  await button(page, "Finish round").tap();
  await button(page.getByRole("dialog"), "Finish round").tap();
}

async function playSolo(page) {
  await page.getByTestId("play-solo").tap();
  await page.getByTestId("game-board").waitFor();
  await placeByTouch(page, { slot: 0, row: 0, col: 0 });
  await waitSavedMove(page, 1);
  const initial = (await state(page)).saved;
  let game = place(createGame(initial.seed, initial.limit), initial.moves[0]);
  let best = { step: 1, gain: game.last.gain };
  assert.deepEqual(initial.board, game.board);
  assert.equal(initial.score, game.score);
  let resumed = false;
  while (!game.done) {
    const move = legalMoves(game)[0];
    const next = place(game, {
      ...move,
      seq: game.moves.length,
      id: randomUUID(),
    });
    await placeByTouch(page, move);
    if (next.done) {
      await shown(page, "Round complete.");
    } else {
      await shown(page, next.moves.length + " placed");
      await waitSavedMove(page, next.moves.length);
      const saved = (await state(page)).saved;
      assert.deepEqual(saved.board, next.board);
      assert.equal(saved.score, next.score);
    }
    game = next;
    if (game.last.gain > best.gain)
      best = { step: game.moves.length, gain: game.last.gain };
    if (!resumed && game.moves.length >= 4 && !game.done) {
      await page.reload();
      await page.getByTestId("play-solo").tap();
      await shown(page, game.moves.length + " placed");
      resumed = true;
    }
  }
  assert.equal(game.reason, "No pieces fit");
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("block-league-v3"));
    return (
      local?.profiles.find((profile) => profile.id === local.active)?.saved ===
      null
    );
  });
  const profile = await state(page);
  assert.equal(profile.history.at(-1).score, game.score);
  assert.equal(profile.saved, null);
  await page.getByText(/placements · No pieces fit/).waitFor();
  await screenshot(page, "01-solo-lockout.png");
  await shown(page, `Best placement · +${best.gain.toLocaleString()}`);
  await button(page, "Review best placement").tap();
  await shown(page, `Move ${best.step}`);
  await button(page, "Back to result").tap();
  await button(page, "Play again").tap();
  await shown(page, "0 placed");
  console.log(
    "PASS Solo natural lockout, verified score, replayable fresh round:",
    {
      placements: game.moves.length,
      score: game.score,
      lines: game.lines,
      resumed,
    },
  );
}

async function playFaceOff(host, guest) {
  for (const page of [host, guest]) {
    await button(page, "Home").tap();
    await button(page, "Play with friends ↗").tap();
  }
  await button(host, "Create live room").tap();
  await shown(host, "PRIVATE ROOM");
  const code = (await host.locator("body").innerText()).match(
    /\b[A-F0-9]{8}\b/,
  )[0];
  await guest.getByLabel("Invitation code").fill(code);
  await button(guest, "Review invitation").tap();
  const invite = guest.getByRole("dialog", { name: "Private match details" });
  assert.match(await invite.innerText(), /15 minutes.*30 placements.*until/s);
  await button(invite, "Join private room").tap();
  await button(guest, "I’m ready").tap();
  await button(host, "I’m ready").tap();
  const users = [];
  for (const page of [host, guest]) {
    await page.getByTestId("game-board").waitFor();
    const profile = await state(page);
    users.push({ token: profile.token, user: await call(profile, "me") });
  }
  const read = (actor) => call(actor, "room.get", { code });
  const [startA, startB] = await Promise.all(users.map(read));
  assert.deepEqual(startA.game, startB.game);
  const observer = await call(null, "register", {
    alias: "Release spectator",
    age: "25-44",
  });
  await reject(observer, "room.get", { code }, /private/i);
  await reject(
    users[0],
    "room.move",
    {
      code,
      move: {
        ...legalMoves(startA.game)[0],
        seq: 4,
        id: randomUUID(),
      },
    },
    /sequence is stale/i,
  );
  await reject(
    users[1],
    "room.move",
    { code, move: { slot: 0, row: -1, col: 0, seq: 0, id: randomUUID() } },
    /does not fit/i,
  );
  await button(host, "Good game!").tap();
  await guest.getByText(/Release Host: Good game!/).waitFor();
  assert.ok(!(await read(users[0])).replays);

  async function complete(page, actor, start, strategic) {
    let room = start;
    while (!room.game.done) {
      const seq = room.game.moves.length;
      const move = strategic ? hint(room.game) : legalMoves(room.game)[0];
      const expected = place(room.game, { ...move, seq, id: randomUUID() });
      const ack = page.waitForResponse(
        async (r) =>
          r.url().endsWith("/api") &&
          r.request().postDataJSON()?.action === "room.move",
      );
      await placeByTouch(page, move);
      const payload = await (await ack).json();
      assert.equal(payload.ok, true, payload.error);
      room = payload.result;
      assert.equal(room.game.moves.length, seq + 1);
      assert.deepEqual(room.game.board, expected.board);
      assert.equal(room.game.score, expected.score);
    }
    const replayed = replay(room.game.seed, room.game.moves);
    assert.equal(replayed.score, room.game.score);
    assert.deepEqual(replayed.board, room.game.board);
    assert.equal((await read(actor)).game.reason, room.game.reason);
    return room.game;
  }
  const [a, b] = await Promise.all([
    complete(host, users[0], startA, true),
    complete(guest, users[1], startB, false),
  ]);
  for (const page of [host, guest])
    await shown(page, "Official result · final");
  const first = await read(users[0]);
  const second = await read(users[1]);
  assert.equal(first.status, "final");
  assert.deepEqual(first.result, second.result);
  assert.deepEqual(first.result.scores, [a.score, b.score]);
  assert.equal(
    first.result.winner,
    a.score === b.score ? null : users[a.score > b.score ? 0 : 1].user.id,
  );
  assert.equal(first.replays.length, 2);
  await screenshot(host, "02-face-off-final.png");
  await button(host, "Review both attempts").tap();
  await button(host, "Next →").tap();
  assert.equal(await host.getByTestId("game-board").count(), 2);
  await button(host, "Back to result").tap();
  await button(host, "Free rematch").tap();
  await shown(host, "PRIVATE ROOM");
  assert.equal((await read(users[0])).status, "final");
  console.log(
    "PASS Two-player live Face-Off full round:",
    [a, b].map((g) => ({
      placements: g.moves.length,
      score: g.score,
      exit: g.reason,
    })),
  );
  return { users, observer };
}

async function club(page) {
  const tab = page.getByRole("tab", { name: "Club", exact: true });
  if (!(await tab.isVisible())) await button(page, "Home").tap();
  await tab.tap();
  await button(page, "Create 8-team Championship").waitFor();
}

async function championship(host, guest, [captain, rival], outsider) {
  const teams = [];
  const rosters = [];
  const playersSeen = new Set();
  await club(host);
  await club(guest);
  for (let index = 0; index < 8; index++) {
    const teamName = "Release Club " + (index + 1);
    const roster = [];
    for (let slot = 0; slot < 3; slot++) {
      const existingCaptain = slot === 0 ? [captain, rival][index] : undefined;
      roster.push(
        existingCaptain ||
          (await call(null, "register", {
            alias: "Club " + (index + 1) + " Player " + (slot + 1),
            age: "25-44",
          })),
      );
    }
    const page = [host, guest][index];
    if (page) {
      await page.getByLabel("Original team name").fill(teamName);
      await button(page, "Create team").tap();
      await shown(page, teamName);
    }
    const team = page
      ? (await call(roster[0], "teams")).find((item) => item.name === teamName)
      : await call(roster[0], "team.create", { name: teamName });
    for (const player of roster.slice(1))
      await call(player, "team.request", { code: team.code });
    if (page) {
      await button(page, "Refresh club").tap();
      await button(page, "Open team").tap();
      await shown(page, roster[1].user.alias + " wants to join");
      await button(page, "Approve player").first().tap();
      await shown(page, roster[1].user.alias);
      await button(page, "Approve player").tap();
      await shown(page, roster[2].user.alias);
      await button(page, "Back to clubhouse").tap();
    } else {
      for (const player of roster.slice(1))
        await call(roster[0], "team.approve", {
          id: team.id,
          member: player.user.id,
        });
    }
    teams.push(team);
    rosters.push(roster);
  }
  assert.equal(
    new Set(rosters.flat().map((player) => player.user.id)).size,
    24,
  );
  await host.getByLabel("Season name").fill("Release Championship");
  await host.getByLabel("Fixture window in hours (1–168)").fill("6");
  await button(host, "Create 8-team Championship").tap();
  await button(host, "Copy league code").waitFor();
  const season = (await call(captain, "leagues")).find(
    (item) => item.name === "Release Championship",
  );
  assert.ok(season);
  const get = () => call(captain, "league.get", { id: season.id });
  assert.equal(
    await button(host, "Lock entries & start season").isDisabled(),
    true,
  );
  await reject(outsider, "league.get", { id: season.id }, /private/i);
  await reject(
    rosters[2][1],
    "league.enter",
    { code: season.code, team: teams[2].id },
    /captain/i,
  );
  for (let index = 0; index < 8; index++) {
    const page = [host, guest][index];
    if (page) {
      if (index === 0) await button(host, "Back to clubhouse").tap();
      await page.getByLabel("Season invitation code").fill(season.code);
      await button(page, "Enter " + teams[index].name + " & lock roster").tap();
      await button(page.getByRole("dialog"), "Enter and lock roster").tap();
      await button(page, "Refresh season").waitFor();
    } else {
      await call(rosters[index][0], "league.enter", {
        code: season.code,
        team: teams[index].id,
      });
    }
  }
  await reject(
    captain,
    "team.remove",
    { id: teams[0].id, member: rosters[0][1].user.id },
    /locked/i,
  );
  await button(host, "Refresh season").tap();
  await button(host, "Lock entries & start season").tap();
  await button(host.getByRole("dialog"), "Cancel").tap();
  assert.equal((await get()).status, "registration");
  await button(host, "Lock entries & start season").tap();
  await button(host.getByRole("dialog"), "Start season").tap();
  await host
    .getByRole("button", { name: /Play \/ review fixture/ })
    .first()
    .waitFor();
  let league = await get();
  assert.equal(league.status, "playing");
  assert.equal(league.fixtures.length, 28);
  await reject(
    outsider,
    "room.get",
    { code: league.fixtures[0].rooms[0] },
    /private/i,
  );
  const processed = new Set();
  let placements = 0;
  for (let round = 0; round < 5 && league.status !== "complete"; round++) {
    for (const fixture of league.fixtures) {
      if (processed.has(fixture.id)) continue;
      const left = teams.findIndex((team) => team.id === fixture.a);
      const right = teams.findIndex((team) => team.id === fixture.b);
      for (const [slot, code] of fixture.rooms.entries()) {
        const actors = [rosters[left][slot], rosters[right][slot]];
        const playedOnPhone =
          left === 0 &&
          right === 1 &&
          slot === 0 &&
          fixture.phase === "round-robin";
        if (playedOnPhone) {
          await button(guest, "Refresh season").tap();
          for (const page of [host, guest])
            await button(page, "Play / review fixture " + code).tap();
        }
        for (const [seat, actor] of actors.entries()) {
          playersSeen.add(actor.user.id);
          const turnCount = (seat === 0 ? left < right : right < left) ? 3 : 1;
          let room = await call(actor, "room.get", { code });
          assert.equal(room.kind, "fixture");
          for (let turn = 0; turn < turnCount; turn++) {
            const move = legalMoves(room.game)[0];
            if (playedOnPhone) {
              const page = [host, guest][seat];
              const ack = page.waitForResponse(
                (r) =>
                  r.url().endsWith("/api") &&
                  r.request().postDataJSON().action === "room.move",
              );
              await placeByTouch(page, move);
              const payload = await (await ack).json();
              assert.equal(payload.ok, true, payload.error);
              room = payload.result;
            } else {
              room = await call(actor, "room.move", {
                code,
                move: { ...move, id: randomUUID(), seq: turn },
              });
            }
            placements++;
          }
          assert.deepEqual(
            room.game.board,
            replay(room.game.seed, room.game.moves).board,
          );
          if (playedOnPhone) await finishByTouch([host, guest][seat]);
          else await call(actor, "room.finish", { code });
        }
        const result = await call(actors[0], "room.get", { code });
        assert.equal(result.status, "final");
        assert.equal(
          result.result.winner,
          actors[left < right ? 0 : 1].user.id,
        );
        if (playedOnPhone) {
          await shown(host, "Official result · final");
          await screenshot(host, "03-championship-fixture.png");
        }
      }
      processed.add(fixture.id);
    }
    league = await get();
  }
  assert.equal(league.status, "complete");
  assert.equal(league.champion, teams[0].id);
  assert.equal(processed.size, 32);
  assert.equal(playersSeen.size, 24);
  assert.equal(placements, 384);
  assert.deepEqual(
    league.fixtures.slice(28).map((fixture) => fixture.phase),
    ["qualifier-1", "eliminator", "qualifier-2", "final"],
  );
  assert.equal(league.standings[0].points, 14);
  assert.ok((await call(captain, "me")).badges.includes("league-champion"));
  for (const player of rosters.flat())
    assert.ok((await call(player, "me")).badges.includes("team-contributor"));
  await club(host);
  await button(host, "View season").tap();
  await shown(host, "League champions. Earned together.");
  for (const phase of ["QUALIFIER 1", "ELIMINATOR", "QUALIFIER 2", "FINAL"])
    await shown(host, phase);
  await host
    .getByText("Fixture points · 6–0", { exact: true })
    .first()
    .waitFor();
  await shown(host, "14 league points · 7 fixtures played");
  await screenshot(host, "04-championship-champion.png");
  console.log(
    "PASS Championship: eight teams, 24 accounts, 32 fixtures, 96 duels, 384 confirmed moves; champion and badges verified",
  );
  const next = await call(captain, "league.create", {
    name: "Follow-up season",
    size: 4,
    windowHours: 1,
  });
  const original = await get();
  await call(captain, "team.remove", {
    id: teams[0].id,
    member: rosters[0][2].user.id,
  });
  await call(outsider, "team.request", { code: teams[0].code });
  await call(captain, "team.approve", {
    id: teams[0].id,
    member: outsider.user.id,
  });
  const repeat = await call(captain, "league.enter", {
    code: next.code,
    team: teams[0].id,
  });
  assert.ok(repeat.teams.includes(teams[0].id));
  assert.equal(
    (await call(outsider, "league.get", { id: next.id })).id,
    next.id,
  );
  await reject(rosters[0][2], "league.get", { id: next.id }, /private/i);
  assert.deepEqual(await get(), original);
  const historical = await call(rosters[0][2], "league.get", { id: season.id });
  assert.ok(historical.myRooms.length > 0);
  await reject(outsider, "league.get", { id: season.id }, /private/i);
  console.log(
    "PASS Completed team can enter another season with changed membership and the archived roster stays private",
  );
}

async function checkDeadlineEdges(host, [captain, rival]) {
  let now = Date.now();
  service.clock = () => now;
  const match = await call(captain, "room.create", { kind: "async" });
  await call(rival, "room.join", { code: match.code });
  const started = await call(captain, "room.ready", { code: match.code });
  now = started.deadline - 1;
  const placeable = await call(captain, "room.get", { code: match.code });
  const choice = legalMoves(placeable.game)[0];
  await call(captain, "room.move", {
    code: match.code,
    move: { ...choice, seq: 0, id: randomUUID() },
  });
  const finished = await call(captain, "room.finish", { code: match.code });
  assert.equal(finished.game.reason, "Finished by player");
  assert.equal(finished.replays, undefined);
  now = started.deadline;
  const expired = await call(captain, "room.get", { code: match.code });
  assert.equal(expired.status, "final");
  assert.equal(expired.result.winner, captain.user.id);
  assert.equal(expired.result.scores[1], 0);
  assert.equal(
    (await call(rival, "room.get", { code: match.code })).game.reason,
    "Match window ended",
  );
  await reject(
    rival,
    "room.move",
    {
      code: match.code,
      move: { ...choice, seq: 0, id: randomUUID() },
    },
    /not accepting moves|complete|closed|expired|finished/i,
  );
  assert.equal(expired.game.reason, finished.game.reason);
  console.log(
    "PASS Async deadline boundary, zero-score no-show and late move refusal",
  );

  const season = await call(captain, "league.create", {
    name: "Late start test",
    size: 4,
    windowHours: 1,
  });
  for (let i = 0; i < 4; i++) {
    const players = [];
    for (let j = 0; j < 3; j++)
      players.push(
        await call(null, "register", {
          alias: "Deadline Club " + (i + 1) + " Seat " + (j + 1),
          age: "25-44",
        }),
      );
    const [leader, ...members] = players;
    const team = await call(leader, "team.create", {
      name: "Deadline Club " + (i + 1),
    });
    for (const member of members) {
      await call(member, "team.request", { code: team.code });
      await call(leader, "team.approve", {
        id: team.id,
        member: member.user.id,
      });
    }
    await call(leader, "league.enter", { code: season.code, team: team.id });
  }
  now = season.deadline + 1;
  await host.clock.setFixedTime(now);
  await club(host);
  await host
    .getByText("Late start test", { exact: true })
    .locator("..")
    .getByRole("button", { name: "View season", exact: true })
    .tap();
  await shown(host, "Registration is closed.");
  await button(host, "Lock entries & start season").tap();
  await button(host.getByRole("dialog"), "Cancel").tap();
  assert.equal(
    (await call(captain, "league.get", { id: season.id })).status,
    "registration",
  );
  await button(host, "Lock entries & start season").tap();
  await button(host.getByRole("dialog"), "Start season").tap();
  await shown(host, "PLAYING");
  assert.equal(
    (await call(captain, "league.get", { id: season.id })).fixtures.length,
    6,
  );
  await screenshot(host, "06-started-after-registration.png");
  console.log(
    "PASS Organiser can start a fully enrolled season after registration closes",
  );
}

async function checkSecondaryActions() {
  process.env.ALLOW_TEST_REWARDS = "1";
  const owner = await phone("CTA Owner");
  const newDevice = await phone("CTA Separate");
  await owner
    .context()
    .grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
  await button(owner, "Profile and settings").tap();
  await button(owner, "Create private online account").tap();
  await shown(owner, "Online account connected.");
  const ownerProfile = await state(owner);
  await button(owner, "Copy my private recovery key").tap();
  await owner
    .getByTestId("toast")
    .getByText(/Store it privately/)
    .waitFor();
  const recovery = await owner.evaluate(() => navigator.clipboard.readText());
  assert.ok(
    recovery && recovery === ownerProfile.recovery,
    "Copy action uses the owner’s recovery key",
  );
  await button(newDevice, "Profile and settings").tap();
  await newDevice.getByLabel("Private recovery key").fill(recovery);
  await button(newDevice, "Recover into a separate profile").tap();
  await newDevice.getByTestId("play-solo").waitFor();
  assert.equal((await state(newDevice)).user.id, ownerProfile.user.id);
  assert.equal(
    await newDevice.evaluate(
      () => JSON.parse(localStorage.getItem("block-league-v3")).profiles.length,
    ),
    2,
  );
  await button(newDevice, "Profile and settings").tap();
  await button(newDevice, "Refresh online progress").tap();
  await shown(newDevice, "Online account connected.");
  console.log(
    "PASS Recovery copy, separate profile recovery and online refresh",
  );

  await club(owner);
  await owner.getByLabel("Original team name").fill("Action Test Club");
  await button(owner, "Create team").tap();
  await shown(owner, "Action Test Club");
  const team = (await call(ownerProfile, "teams")).find(
    (item) => item.name === "Action Test Club",
  );
  const prospect = await phone("Roster Request");
  await club(prospect);
  await prospect.getByLabel("Team invite code").fill(team.code);
  await button(prospect, "Request to join").tap();
  await prospect
    .getByTestId("toast")
    .getByText(/Request sent/)
    .waitFor();
  await button(owner, "Refresh club").tap();
  await button(owner, "Open team").tap();
  await button(owner, "Copy team code").tap();
  await owner
    .getByTestId("toast")
    .getByText(/Share only with people you know/)
    .waitFor();
  assert.equal(
    await owner.evaluate(() => navigator.clipboard.readText()),
    team.code,
  );
  await shown(owner, "Roster Request wants to join");
  await button(owner, "Decline").tap();
  await owner
    .getByText("Roster Request wants to join", { exact: true })
    .waitFor({ state: "hidden" });
  await owner
    .getByLabel("Report a team-name concern")
    .fill("Release QA report for an isolated test team.");
  await button(owner, "Submit private report").tap();
  await owner
    .getByTestId("toast")
    .getByText(/Report recorded/)
    .waitFor();
  assert.ok(service.db.reports.some((report) => report.target === team.id));
  console.log("PASS Team code copy, join request, decline and private report");

  const child = await phone("Guardian Test", "7-12");
  await button(child, "Profile and settings").tap();
  await child.getByLabel("Guardian PIN (6 digits)").fill("852963");
  await button(child, "Set guardian PIN").tap();
  await button(child, "Enable private social play").waitFor();
  await child.getByLabel("Guardian PIN (6 digits)").fill("852964");
  await button(child, "Enable private social play").tap();
  await shown(child, "Guardian PIN is incorrect");
  await child.getByLabel("Guardian PIN (6 digits)").fill("852963");
  await button(child, "Enable private social play").tap();
  await button(child, "Private social play enabled").waitFor();
  await button(child, "Approve external sharing").tap();
  await button(child, "Disable external sharing").waitFor();
  await button(child, "Disable social access").tap();
  await button(child, "Enable private social play").waitFor();
  const protectedAccount = await call(await state(child), "me");
  assert.equal(protectedAccount.social, false);
  assert.equal(protectedAccount.sharing, false);
  console.log(
    "PASS Guardian PIN setup, wrong PIN, social and sharing approval, and revocation",
  );

  await button(owner, "Profile and settings").tap();
  await button(owner, "Cosmetic studio").tap();
  for (const outcome of ["skipped", "failed", "completed"]) {
    await button(owner, "Request cosmetic test offer").tap();
    await button(owner, "Simulate " + outcome).tap();
    await shown(owner, "Test reward " + outcome + ".");
    assert.equal(
      (await call(ownerProfile, "me")).rewards.includes("aurora"),
      outcome === "completed",
    );
  }
  await button(owner, "Request cosmetic test offer").tap();
  await button(owner, "No thanks — keep playing").tap();
  await owner.getByTestId("play-solo").waitFor();
  console.log(
    "PASS Cosmetic simulator handles skip, failure, completion and returning to free play",
  );

  await newDevice.setViewportSize({ width: 320, height: 760 });
  await button(newDevice, "Accessibility & appearance").tap();
  await button(newDevice, "Night Club").tap();
  await button(newDevice, "Profile and settings").tap();
  await button(newDevice, "Delete online account").tap();
  const deletion = newDevice.getByRole("dialog", {
    name: "Delete your Block League account?",
  });
  await deletion.getByText(/cloud progress/).waitFor();
  assert.equal(
    await newDevice.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await screenshot(newDevice, "07-delete-confirm-dark.png");
  await button(deletion, "Cancel").tap();
  assert.equal((await call(ownerProfile, "me")).id, ownerProfile.user.id);
  await button(newDevice, "Delete online account").tap();
  await button(deletion, "Delete account").tap();
  await shown(newDevice, "Your online account was deleted.");
  await newDevice.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("block-league-v3")).profiles.length === 1,
  );
  const separate = await state(newDevice);
  assert.equal(separate.alias, "CTA Separate");
  await reject(ownerProfile, "me", {}, /sign in/i);
  await reject(null, "recover", { recovery }, /not recognised/i);
  console.log(
    "PASS In-app account deletion can be cancelled and confirmed, revokes all sessions, and keeps other profiles",
  );

  const external = await call(null, "register", {
    alias: "External deletion QA",
    age: "25-44",
  });
  const publicPage = await (
    await browser.newContext({ viewport: { width: 320, height: 760 } })
  ).newPage();
  await publicPage.goto(base + "/account-deletion");
  await publicPage.getByLabel("Private recovery key").fill(external.recovery);
  await publicPage.getByLabel("Permanently delete this online account").check();
  await button(publicPage, "Delete account").click();
  const resultNotice = publicPage.getByRole("status");
  assert.match(
    await resultNotice.innerText(),
    /Your online account was deleted/,
  );
  await reject(external, "me", {}, /sign in/i);
  await screenshot(publicPage, "08-account-deleted-web.png");
  console.log(
    "PASS Public deletion page works with a recovery key in a fresh session",
  );
}

try {
  browser = await chromium.launch();
  if (process.argv.includes("--cta-only")) {
    await checkSecondaryActions();
  } else if (process.argv.includes("--deadlines-only")) {
    const host = await phone("Release Host");
    await button(host, "Profile and settings").tap();
    await button(host, "Create private online account").tap();
    await shown(host, "Online account connected.");
    const captain = await state(host);
    captain.user = await call(captain, "me");
    const rival = await call(null, "register", {
      alias: "Deadline Rival",
      age: "25-44",
    });
    await checkDeadlineEdges(host, [captain, rival]);
  } else {
    await playSolo(await phone("Release Solo"));
    const host = await phone("Release Host");
    const guest = await phone("Release Guest");
    const { users, observer } = await playFaceOff(host, guest);
    await championship(host, guest, users, observer);
    await checkDeadlineEdges(host, users);
  }
  assert.deepEqual(runtimeErrors, []);
  console.log("Screenshots:", captures);
} catch (error) {
  await Promise.allSettled(
    phonePages.map((page, index) =>
      screenshot(page, "failure-" + index + ".png"),
    ),
  );
  console.error("QA screenshots:", captures);
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
