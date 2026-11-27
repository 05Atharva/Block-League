import assert from "node:assert/strict";
import { once } from "node:events";
import { join } from "node:path";
import { chromium } from "playwright";
import { startServer } from "../server/index.ts";
import { legalMoves } from "../shared/engine.ts";
import { defaults } from "../app/src/design.ts";

const { server, service } = startServer({
  port: 0,
  file: "",
  championshipEnabled: false,
});
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
const layout = {
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
};
const captures = process.env.BLOCK_LEAGUE_INTERACTION_CAPTURES;
let browser;
const button = (page, name) => page.getByRole("button", { name, exact: true });

try {
  browser = await chromium.launch();
  const local = await browser.newContext(layout);
  const page = await local.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/?challenge=313");
  await button(page, "Let’s play").click();
  await page
    .getByTestId("toast")
    .getByRole("alert")
    .getByText(/two characters/)
    .waitFor();
  await button(page, "Dismiss notification").click();
  await page.getByTestId("toast").waitFor({ state: "detached" });
  await page.getByLabel("Choose an alias").fill("Interaction Tester");
  await button(page, "18-24").click();
  await button(page, "Let’s play").click();
  await page.getByTestId("game-board").waitFor();
  await page.getByText("UNRANKED CHALLENGE", { exact: true }).waitFor();
  await button(page, "Home").click();
  await button(page, "Notifications").click();
  let drawer = page.getByRole("dialog", { name: "Notifications" });
  await drawer.getByText("You’re all caught up.").waitFor();
  await page.keyboard.press("Escape");
  await drawer.waitFor({ state: "hidden" });
  assert.equal(
    await button(page, "Notifications").evaluate(
      (node) => node === document.activeElement,
    ),
    true,
  );
  console.log(
    "PASS Error toast is announced and dismissible; notifications return keyboard focus",
  );

  await page.getByTestId("play-solo").click();
  await button(page, "Finish round").click();
  const dialog = page.getByRole("dialog", { name: "Finish this round?" });
  await dialog.waitFor();
  if (captures)
    await page.screenshot({
      path: join(captures, "block-league-confirmation.png"),
    });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).focus();
  await page.keyboard.press("Enter");
  await dialog.waitFor({ state: "hidden" });
  await page.getByTestId("game-board").waitFor();
  assert.equal(
    await button(page, "Finish round").evaluate(
      (node) => node === document.activeElement,
    ),
    true,
  );
  await button(page, "? Help").click();
  await page
    .getByRole("dialog")
    .getByText(/Choose a piece/)
    .waitFor();
  await page.keyboard.press("Escape");
  await page.getByTestId("game-board").waitFor();
  console.log(
    "PASS The finish confirmation cancels safely; Help preserves the board",
  );

  await button(page, "Profile and settings").click();
  await button(page, "Mute for one hour").click();
  await page
    .getByTestId("toast")
    .getByRole("status")
    .getByText("Reminders muted for one hour.")
    .waitFor();
  await page.reload();
  await button(page, "Profile and settings").click();
  await button(page, "Resume reminders").waitFor();
  assert.equal(await button(page, "Mute for one hour").isDisabled(), true);
  await button(page, "Resume reminders").click();
  assert.equal(await button(page, "Mute for one hour").isEnabled(), true);
  await button(page, "Accessibility & appearance").click();
  await button(page, "200%").click();
  await page.setViewportSize({ width: 320, height: 640 });
  await button(page, "Notifications").click();
  drawer = page.getByRole("dialog", { name: "Notifications" });
  await drawer.getByText("You’re all caught up.").waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await drawer
    .getByRole("button", { name: "Close notifications", exact: true })
    .click();
  const heading = await page
    .getByRole("heading", { name: "Settings" })
    .boundingBox();
  assert.ok(heading && heading.height < 75);
  await button(page, "Home").click();
  await page.getByTestId("play-solo").click();
  const cancel = button(page, "Cancel");
  await cancel.scrollIntoViewIfNeeded();
  const background = await cancel.boundingBox();
  const label = await cancel.getByText("Cancel", { exact: true }).boundingBox();
  const place = await page.getByTestId("confirm-place").boundingBox();
  assert.ok(
    background &&
      label &&
      place &&
      label.x >= background.x &&
      label.x + label.width <= background.x + background.width + 1 &&
      background.y + background.height <= place.y,
  );
  if (captures)
    await page.screenshot({
      path: join(captures, "retest-large-placement-controls.png"),
    });
  await page.setViewportSize({ width: 1024, height: 768 });
  await button(page, "Notifications").click();
  const side = await drawer.getByTestId("overlay-panel").boundingBox();
  assert.ok(side && side.x >= 600 && side.x + side.width <= 1012);
  await page.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  await local.close();
  console.log(
    "PASS Timed quiet mode persists and the notification drawer fits 320 px at 200% text",
  );

  const host = service.dispatch("register", {
    alias: "Offline host",
    age: "18-24",
  });
  const guest = service.dispatch("register", {
    alias: "Offline guest",
    age: "18-24",
  });
  const { code } = service.dispatch(
    "room.create",
    { kind: "async" },
    host.token,
  );
  service.dispatch("room.join", { code }, guest.token);
  const start = service.dispatch("room.ready", { code }, host.token);
  const move = legalMoves(start.game)[0];
  const offline = await browser.newContext(layout);
  await offline.addInitScript(
    (state) => {
      if (!localStorage.getItem("block-league-v3"))
        localStorage.setItem("block-league-v3", JSON.stringify(state));
    },
    {
      server: base,
      active: "offline",
      profiles: [
        {
          id: "offline",
          alias: host.user.alias,
          age: "18-24",
          settings: { ...defaults, theme: "dark" },
          token: host.token,
          user: host.user,
          saved: null,
          best: 0,
          practiceBest: 0,
          stars: 0,
          badges: [],
          history: [],
        },
      ],
    },
  );
  const play = await offline.newPage();
  await play.goto(base);
  await button(play, "Play with friends ↗").click();
  await button(play, "Refresh my matches").click();
  await button(play, "Open match").click();
  await play.getByTestId("game-board").waitFor();
  await play.waitForFunction(
    () =>
      Object.values(
        JSON.parse(localStorage.getItem("block-league-v3")).profiles[0]
          .asyncDrafts ?? {},
      ).length === 1,
  );
  const block = (route) => route.abort("internetdisconnected");
  await offline.route("**/api", block);
  await play.getByText("Playing offline", { exact: true }).waitFor();
  await play.getByTestId(`piece-${move.slot}`).click();
  await play.getByTestId(`cell-${move.row}-${move.col}`).click();
  await play.getByTestId("confirm-place").click();
  assert.equal(
    service.dispatch("room.get", { code }, host.token).game.moves.length,
    0,
  );
  await button(play, "Finish round").click();
  await play.getByTestId("confirm-dialog").click();
  await play
    .getByText("Attempt awaiting verification", { exact: true })
    .waitFor();
  await play.waitForFunction(() =>
    Object.values(
      JSON.parse(localStorage.getItem("block-league-v3")).profiles[0]
        .asyncDrafts ?? {},
    ).some((draft) => draft.finish && draft.queued.length === 1),
  );
  await play.reload();
  await button(play, "Play with friends ↗").click();
  await button(play, "Open saved challenge").click();
  await play
    .getByText("Attempt awaiting verification", { exact: true })
    .waitFor();
  await offline.unroute("**/api", block);
  await play.getByText("Your attempt is complete.", { exact: true }).waitFor();
  assert.equal(
    service.dispatch("room.get", { code }, host.token).game.moves.length,
    1,
  );
  service.dispatch("room.finish", { code }, guest.token);
  await play.getByText("Official result · final", { exact: true }).waitFor();
  await play.reload();
  await button(play, "Notifications").click();
  drawer = play.getByRole("dialog", { name: "Notifications" });
  await drawer.getByText("Match result ready", { exact: true }).waitFor();
  if (captures)
    await play.screenshot({
      path: join(captures, "block-league-notifications.png"),
    });
  await drawer.getByRole("button", { name: "Open match", exact: true }).click();
  await play.getByText("Official result · final", { exact: true }).waitFor();
  await button(play, "Profile and settings").click();
  await button(play, "Mute for one hour").click();
  const near = service.dispatch("room.create", { kind: "async" }, guest.token);
  service.dispatch("room.join", { code: near.code }, host.token);
  service.dispatch("room.ready", { code: near.code }, guest.token);
  service.db.rooms[near.code].deadline = Date.now() + 1800000;
  const observed = play.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.request().postDataJSON()?.action === "rooms",
  );
  await play.reload();
  await observed;
  await button(play, "Notifications").click();
  await play.getByText("Match result ready", { exact: true }).waitFor();
  assert.equal(
    await play.getByText("Challenge ends soon", { exact: true }).count(),
    0,
  );
  await button(play, "Close notifications").click();
  await button(play, "Profile and settings").click();
  await button(play, "Resume reminders").click();
  await button(play, "Notifications").click();
  await play.getByText("Challenge ends soon", { exact: true }).waitFor();
  await button(play, "Close notifications").click();
  console.log(
    "PASS Quiet mode suppresses an actual upcoming challenge reminder",
  );

  const live = service.dispatch("room.create", {}, guest.token);
  async function acceptLive() {
    await play.getByLabel("Invitation code").fill(live.code);
    await button(play, "Review invitation").click();
    await button(
      play.getByRole("dialog", { name: "Private match details" }),
      "Join private room",
    ).click();
    await button(play, "I’m ready").waitFor();
  }
  await button(play, "Home").click();
  await button(play, "Play with friends ↗").click();
  await acceptLive();
  service.dispatch("room.remove", { code: live.code }, guest.token);
  await play
    .getByText("This room is no longer available", { exact: true })
    .waitFor();
  assert.equal(await button(play, "I’m ready").count(), 0);
  await button(play, "Back to matches").click();
  await acceptLive();
  service.dispatch("room.ready", { code: live.code }, guest.token);
  await button(play, "I’m ready").click();
  await play.getByTestId("game-board").waitFor();
  await offline.route("**/api", block);
  await play.getByText("Reconnecting…", { exact: true }).waitFor();
  assert.equal(
    await play.getByText("This room is private", { exact: true }).count(),
    0,
  );
  await offline.unroute("**/api", block);
  await play
    .getByText("Reconnecting…", { exact: true })
    .waitFor({ state: "hidden" });
  console.log(
    "PASS Removed guests see no stale lobby and can reconnect normally after rejoining",
  );

  await button(play, "Home").click();
  await button(
    play.getByRole("dialog", { name: "Leave the match screen?" }),
    "Go home",
  ).click();
  await play.getByRole("tab", { name: "Club", exact: true }).click();
  await play.getByText(/each individual duel earns 2 points/).waitFor();
  await play.getByText(/each team fixture earns 2 league points/).waitFor();
  assert.equal(await button(play, "Create 8-team Championship").count(), 0);
  const seasonName = "Mobile QA Six Hour Season";
  await play.getByLabel("Season name").fill(seasonName);
  await play.getByLabel("Fixture window in hours (1–168)").fill("6");
  await button(play, "Create 4-team Mini League").click();
  await play.getByText(seasonName, { exact: true }).last().waitFor();
  await button(play, "Copy league code").waitFor();
  Object.values(service.db.leagues).find(
    (league) => league.name === seasonName,
  ).deadline = Date.now() - 10000;
  await button(play, "Refresh season").click();
  await play.getByText("Registration is closed.", { exact: true }).waitFor();
  assert.equal(await button(play, "Copy league code").count(), 0);
  await button(play, "Profile and settings").click();
  await button(play, "Cosmetic studio").click();
  await button(play, "Check purchase restoration").click();
  await play
    .getByTestId("toast")
    .getByRole("status")
    .getByText("Notice", { exact: true })
    .waitFor();
  await play
    .getByTestId("toast")
    .getByText(/Store billing is not configured/)
    .waitFor();
  await offline.close();
  console.log(
    "PASS Offline result deep-link, league scoring explanations, Championship visibility, closed registration, and honest billing notice",
  );

  const touch = await browser.newContext({
    ...layout,
    hasTouch: true,
    isMobile: true,
  });
  const board = await touch.newPage();
  await board.goto(base);
  await board.getByLabel("Choose an alias").fill("Touch QA");
  await button(board, "Let’s play").tap();
  await board.getByTestId("play-solo").tap();
  const piece = await board.getByTestId("piece-0").boundingBox();
  const cell = await board.getByTestId("cell-0-0").boundingBox();
  const session = await touch.newCDPSession(board);
  function midpoint(rect) {
    return [rect.x + rect.width / 2, rect.y + rect.height / 2];
  }
  const [sx, sy] = midpoint(piece),
    [tx, ty] = midpoint(cell);
  const pointer = (x, y) => [{ x, y, id: 1, radiusX: 4, radiusY: 4 }];
  const touchEvent = (type, touchPoints = []) =>
    session.send("Input.dispatchTouchEvent", { type, touchPoints });
  const fitPreview = board.getByText("✓ Fits at row 1, column 1", {
    exact: true,
  });
  async function dragToFirstCell() {
    await touchEvent("touchStart", pointer(sx, sy));
    for (let step = 1; step <= 12; step++) {
      await touchEvent(
        "touchMove",
        pointer(sx + ((tx - sx) * step) / 12, sy + ((ty - sy) * step) / 12),
      );
      await board.waitForTimeout(16);
    }
    await fitPreview.waitFor();
  }
  for (const outcome of ["outside", "cancel"]) {
    await dragToFirstCell();
    if (outcome === "outside") await touchEvent("touchMove", pointer(3, ty));
    await touchEvent(outcome === "cancel" ? "touchCancel" : "touchEnd");
    await fitPreview.waitFor({ state: "hidden" });
    assert.equal(await board.getByTestId("confirm-place").isDisabled(), true);
    await board.getByText("0 placed", { exact: true }).waitFor();
  }
  await dragToFirstCell();
  await touchEvent("touchEnd");
  await fitPreview.waitFor();
  await board.getByText("0 placed", { exact: true }).waitFor();
  if (captures)
    await board.screenshot({ path: join(captures, "retest-touch-drag.png") });
  await board.getByTestId("confirm-place").tap();
  await board.getByText("1 placed", { exact: true }).waitFor();
  await button(board, "Profile and settings").tap();
  await button(board, "Accessibility & appearance").tap();
  await button(board, "मराठी").tap();
  await button(board, "मुख्य पान").tap();
  await board.getByTestId("play-solo").tap();
  const saved = await board.evaluate(
    () => JSON.parse(localStorage.getItem("block-league-v3")).profiles[0].saved,
  );
  const next = legalMoves(saved)[0];
  await board.getByTestId(`piece-${next.slot}`).tap();
  await board.getByTestId(`cell-${next.row}-${next.col}`).tap();
  await board
    .getByText(`✓ ओळ ${next.row + 1}, स्तंभ ${next.col + 1} येथे बसतो`, {
      exact: true,
    })
    .waitFor();
  await board.getByText("1 तुकडा ठेवला", { exact: true }).waitFor();
  if (captures)
    await board.screenshot({
      path: join(captures, "retest-marathi-board.png"),
    });
  console.log(
    "PASS Valid touch drag previews only, cancellation and outside drops clear it, and Marathi gameplay cues are localized",
  );
  await touch.close();
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
