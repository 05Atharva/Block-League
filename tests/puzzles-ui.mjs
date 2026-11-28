import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { cpuMove, DAY, JOURNEY, puzzleSolved } from "../shared/puzzles.ts";
import { legalMoves, replay } from "../shared/engine.ts";
import { startServer } from "../server/index.ts";

const captures = mkdtempSync(join(tmpdir(), "block-league-puzzle-qa-"));
const { server, service } = startServer({ port: 0, file: "" });
await once(server, "listening");
const base = "http://127.0.0.1:" + server.address().port;
const browser = await chromium.launch();
const errors = [];
const button = (page, name) => page.getByRole("button", { name, exact: true });
const click = (page, name) => button(page, name).click();
const shown = (page, name) =>
  page.getByText(name, { exact: true }).first().waitFor();
const save = (page, name) =>
  page.screenshot({ path: join(captures, name + ".png") });
const play = (page) => page.getByRole("tab", { name: "Play" }).click();
const state = (page) =>
  page.evaluate(() => {
    const storage = JSON.parse(localStorage.getItem("block-league-v3"));
    return storage.profiles.find((item) => item.id === storage.active);
  });
const waitForScore = (page, mode, length) =>
  page.waitForFunction(
    ({ mode, length }) => {
      const storage = JSON.parse(localStorage.getItem("block-league-v3"));
      const profile = storage.profiles.find(
        (item) => item.id === storage.active,
      );
      return profile.extras?.[mode]?.game.moves.length === length;
    },
    { mode, length },
  );
const log = (message) => console.log("PASS", message);

async function phone(alias, age = "25-44") {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    timezoneId: "Asia/Kolkata",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("ERR_INTERNET_DISCONNECTED")
    )
      errors.push(message.text());
  });
  await page.goto(base);
  await page.getByLabel("Choose an alias").fill(alias);
  await click(page, age);
  await click(page, "Let’s play");
  return { page, context };
}
async function move(page, { slot, row, col }) {
  await page.getByTestId("piece-" + slot).tap();
  await page.getByTestId(`cell-${row}-${col}`).tap();
  await page.getByTestId("extra-confirm").tap();
}
async function useHint(page) {
  await click(page, "Hint");
  await page.getByTestId("extra-confirm").click();
}
async function finishAttempt(page, mode, tier) {
  let current = (await state(page)).extras[mode].game;
  while (!current.done) {
    const choice = tier
      ? cpuMove(current, tier).moves.at(-1)
      : legalMoves(current)[0];
    await move(page, choice);
    await waitForScore(page, mode, current.moves.length + 1);
    current = (await state(page)).extras[mode].game;
  }
  return current;
}
async function appearance(page, theme, text = "100%") {
  await page.getByRole("tab", { name: "You" }).click();
  await click(page, "Accessibility & appearance");
  await click(page, theme);
  await click(page, text);
  await play(page);
}
async function overflow(page) {
  const scroll = page.getByTestId("screen-content");
  assert.ok(
    await scroll.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
}

try {
  const { page: a, context: ac } = await phone("Mira");
  const { page: b } = await phone("Dev");
  const { page: child } = await phone("Juniper", "7-12");
  await a.getByTestId("play-solo").click();
  await a.getByTestId("piece-0").click();
  await a.getByTestId("cell-0-0").click();
  await a.getByTestId("confirm-place").click();
  await click(a, "Home");
  await save(a, "01-play-light");

  await click(a, "Puzzles");
  await overflow(a);
  await save(a, "02-daily-light");
  await click(a, "Journey");
  for (const puzzle of JOURNEY) {
    await click(a, "Play " + puzzle.title);
    for (const _ of puzzle.solution) await useHint(a);
    await shown(a, "Journey tile earned.");
    await click(a, "Back to Journey");
  }
  await shown(
    a,
    "Six untimed boards for learning new ways to clear space. 6 of 6 complete.",
  );
  await click(a, "Collection");
  await click(a, "Equip Trailblazer");
  await shown(a, "Trailblazer");
  await save(a, "03-collection-light");
  await click(a, "Open cosmetic studio");
  for (const name of ["Monsoon Tile", "Kiln & Clay"]) {
    const palette = a.getByText(name, { exact: true }).locator("..");
    assert.ok(await button(palette, "Use palette").isEnabled());
    await button(palette, "Use palette").click();
  }
  log("All six Journey boards, earned title, palette unlock and equip");

  await play(a);
  await click(a, "Puzzles");
  await click(a, "Open today’s puzzle");
  await a.getByTestId("game-board").waitFor();
  const original = (await state(a)).extras.daily;
  await ac.setOffline(true);
  for (const _ of original.puzzle.solution) await useHint(a);
  await shown(a, "Puzzle solved.");
  await click(a, "Verify my solve");
  await a.getByText(/Could not reach the game server/).waitFor();
  await ac.setOffline(false);
  await a.emulateMedia({ reducedMotion: "no-preference" });
  await a.evaluate(() => {
    window.seatingObserved = false;
    const observer = new MutationObserver(() => {
      const transform = document.querySelector('[data-testid="daily-stamp"]')
        ?.style.transform;
      if (transform && transform !== "none" && transform !== "scale(1)") {
        window.seatingObserved = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ["style"],
    });
  });
  await click(a, "Verify my solve");
  await shown(a, "Daily tile verified.");
  await a.waitForFunction(() => window.seatingObserved);
  await a.emulateMedia({ reducedMotion: "reduce" });
  await a.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('[data-testid="daily-stamp"]'))
        .transform === "none",
  );
  await save(a, "04-tile-result");
  await click(a, "Back to Daily Puzzle");
  assert.equal(await a.getByRole("button", { name: /, verified$/ }).count(), 1);
  await button(a, "Earlier days").scrollIntoViewIfNeeded();
  await save(a, "13-daily-map");
  await click(a, "Earlier days");
  await a
    .getByRole("button", { name: /archived practice$/ })
    .first()
    .click();
  await shown(a, "PRACTICE");
  await click(a, "Back to Daily Puzzle");
  log(
    "Daily offline retry, one map tile, animated and static stamp, archived practice",
  );

  await click(a, "Friend streaks");
  await click(a, "Create friend code");
  const invite = (await a.getByTestId("friend-code").innerText()).replace(
    /\s/g,
    "",
  );
  await click(b, "Puzzles");
  await click(b, "Friend streaks");
  await click(b, "Refresh friend streaks");
  await b.getByTestId("friend-code-input").fill(invite);
  await click(b, "Connect");
  await shown(b, "Progress is private.");
  await a.getByRole("switch", { name: "Share with connected friends" }).click();
  await click(b, "Refresh friend streaks");
  await shown(b, "1 day in a row");
  await save(b, "05-friend-streak");

  await click(a, "Weekly Board");
  await click(b, "Weekly Board");
  await click(a, "Open this week’s board");
  await a.getByTestId("game-board").waitFor();
  const weekly = await finishAttempt(a, "weekly");
  await click(a, "Verify weekly score");
  await a.getByText(/^Verified score ·/).waitFor();
  await click(b, "Refresh Weekly Board");
  await shown(b, weekly.score.toLocaleString() + " pts");
  await save(b, "06-weekly-board");
  await click(a, "Back to Weekly Board");
  await click(a, "Replay current board");
  await a.getByText(/^Practice · Week of/).waitFor();
  assert.equal((await state(a)).extras.weekly.verified, weekly.score);
  await click(a, "Back to Weekly Board");
  await click(a, "Friend streaks");
  await a.getByRole("switch", { name: "Share with connected friends" }).click();
  await click(b, "Refresh Weekly Board");
  await shown(b, "Shared scores from connected friends appear here.");
  await click(b, "Friend streaks");
  await shown(b, "Progress is private.");
  await click(b, "Remove Mira");
  await click(b, "Cancel");
  await shown(b, "Progress is private.");
  await click(b, "Remove Mira");
  await click(b, "Remove friend");
  await shown(b, "Connect with a friend to see them here.");
  log(
    "Independent friend accounts, privacy default, weekly competition, revocation and removal",
  );

  await appearance(a, "Night Club");
  await click(a, "CPU Duel");
  await save(a, "07-cpu-picker-dark");
  await click(a, "Planner");
  await click(a, "Architect");
  await click(a, "Starter");
  await click(a, "Play Starter CPU");
  let human = (await state(a)).extras.cpu.game;
  await move(a, cpuMove(human, "Architect").moves.at(-1));
  await waitForScore(a, "cpu", 1);
  await play(a);
  await a.reload();
  await click(a, "CPU Duel");
  await click(a, "Resume CPU Duel");
  await save(a, "08-cpu-game-dark");
  human = await finishAttempt(a, "cpu", "Architect");
  await button(a, "Rematch").waitFor();
  const completed = (await state(a)).extras.cpu;
  assert.equal(completed.game.score, human.score);
  assert.equal(completed.game.seed, completed.cpu.seed);
  assert.ok(completed.cpu.done);
  await click(a, "Review CPU moves");
  await click(a, "Next placement");
  const first = replay(completed.cpu.seed, completed.cpu.moves.slice(0, 1));
  await shown(
    a,
    `1 of ${completed.cpu.moves.length} placements · ${first.score} points`,
  );
  await shown(a, "CPU replay");
  await save(a, "09-cpu-result-dark");
  await click(a, "Rematch");
  await a.getByTestId("game-board").waitFor();
  log("Full CPU match, mid-match reload, final scores, replay and rematch");

  await play(a);
  await click(a, "Open Table");
  await click(a, "Start Open Table");
  const table = (await state(a)).extras.open.game;
  await move(a, legalMoves(table)[0]);
  await click(a, "Close this chapter");
  await click(a, "Cancel");
  await click(a, "Close this chapter");
  await click(a, "Close chapter");
  await shown(a, "Chapter complete.");
  await click(a, "Start next chapter");
  await shown(a, "CHAPTER 2");
  await save(a, "10-open-table-dark");
  await play(a);
  assert.equal((await state(a)).saved.moves.length, 1);
  assert.equal((await state(a)).extras.open.chapters, 1);
  log("Open Table chapter rollover and independent Classic save");

  await click(child, "Puzzles");
  assert.equal(await button(child, "Friend streaks").count(), 0);
  assert.equal(await button(child, "Open today’s puzzle").count(), 0);
  await click(child, "Play today in practice");
  await child.getByTestId("game-board").waitFor();
  const childPuzzle = (await state(child)).extras.practice.puzzle;
  for (const _ of childPuzzle.solution) await useHint(child);
  await shown(child, "Practice tile earned.");
  await click(child, "Back to Daily Puzzle");
  assert.equal(
    await child.getByRole("button", { name: /, practice solved$/ }).count(),
    1,
  );
  log(
    "Protected profile earns a practice tile with social and verification gated",
  );

  await appearance(a, "High contrast", "200%");
  await a.setViewportSize({ width: 320, height: 740 });
  await click(a, "Puzzles");
  await overflow(a);
  await save(a, "11-daily-320-contrast");
  await click(a, "Play today in practice");
  await overflow(a);
  const candidate = legalMoves((await state(a)).extras.practice.game)[0];
  await a.getByTestId("piece-" + candidate.slot).focus();
  await a.keyboard.press("Enter");
  await a.getByTestId(`cell-${candidate.row}-${candidate.col}`).focus();
  await a.keyboard.press("Enter");
  assert.ok(await a.getByTestId("extra-confirm").isEnabled());
  await save(a, "12-board-320-contrast");
  await a.getByTestId("extra-confirm").focus();
  await a.keyboard.press("Enter");
  await waitForScore(a, "practice", 1);
  await click(a, "Back to Daily Puzzle");
  await click(a, "Browse puzzle modes");
  await click(a, "Collection");
  await overflow(a);
  log(
    "320px high contrast and 200% text, keyboard preview, no horizontal overflow",
  );

  const p = (await state(a)).extras.daily;
  assert.ok(puzzleSolved(p.puzzle, p.game));
  assert.equal(p.credit, "verified");
  const currentClock = service.clock();
  service.clock = () => currentClock + 2 * DAY;
  const saved = await state(a);
  assert.equal(
    service.dispatch("puzzle.status", {}, saved.token).stats.current,
    0,
  );
  assert.equal(
    service.dispatch("puzzle.status", {}, saved.token).stats.best,
    1,
  );
  assert.deepEqual(errors, []);
  console.log("Captures", captures);
} catch (error) {
  console.log("Captures", captures);
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
