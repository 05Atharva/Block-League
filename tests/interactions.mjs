import assert from "node:assert/strict";
import { once } from "node:events";
import { join } from "node:path";
import { chromium } from "playwright";
import { startServer } from "../server/index.ts";
import { legalMoves } from "../shared/engine.ts";
import { defaults } from "../app/src/design.ts";

const { server, service } = startServer({ port: 0, file: "" });
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
  await page.goto(base);
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
  await offline.close();
  console.log(
    "PASS Offline challenge persists through reload, syncs once, and opens from a result notification",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
