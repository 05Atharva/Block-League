import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { defaults } from "../app/src/design.ts";
import { createGame, hint, place } from "../shared/engine.ts";
import { startServer } from "../server/index.ts";

// Use the real puzzle engine to save a board one confirmed placement before a clear.
function beforeClear() {
  let game = createGame(313);
  while (!game.done) {
    const next = hint(game);
    const updated = place(game, {
      ...next,
      seq: game.moves.length,
      id: `motion-${game.moves.length}`,
    });
    if (updated.last.lines) return { game, next, updated };
    game = updated;
  }
  throw new Error("The motion fixture did not produce a line clear");
}

const { game, next, updated } = beforeClear();
const temp = await mkdtemp(join(tmpdir(), "block-league-motion-"));
const captures = process.env.BLOCK_LEAGUE_MOTION_CAPTURES;
if (captures) await mkdir(captures, { recursive: true });
const { server } = startServer({ port: 0, file: join(temp, "data.json") });
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
const viewport = { width: 390, height: 844 };
let browser;

async function seed(context, settings) {
  await context.addInitScript(
    ({ local }) => {
      if (!localStorage.getItem("block-league-v3"))
        localStorage.setItem("block-league-v3", JSON.stringify(local));
    },
    {
      local: {
        active: "motion",
        server: base,
        profiles: [
          {
            id: "motion",
            alias: "Mira",
            age: "18-24",
            settings: { ...defaults, ...settings },
            saved: game,
            best: game.score,
            practiceBest: 0,
            stars: 2,
            badges: [],
            history: [],
          },
        ],
      },
    },
  );
}

async function trackClear(page) {
  await page.evaluate(() => {
    window.clearWaveSeen = false;
    const observer = new MutationObserver(() => {
      const overlay = document.querySelector('[data-testid="line-clear-wave"]');
      if (overlay && Number(overlay.style.opacity) > 0)
        window.clearWaveSeen = true;
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ["style"],
    });
  });
}

const cases = [
  { name: "Default motion", enabled: true, settings: { theme: "dark" } },
  { name: "System reduced motion", enabled: false, reducedMotion: "reduce" },
  { name: "Low effects", enabled: false, settings: { lowEffects: true } },
  { name: "App motion disabled", enabled: false, settings: { motion: false } },
];

try {
  browser = await chromium.launch();
  if (captures) {
    const light = await browser.newContext({ viewport });
    await seed(light, { theme: "light" });
    const page = await light.newPage();
    await page.goto(base);
    await page.getByTestId("play-solo").waitFor();
    await page.waitForFunction(() => document.fonts.status === "loaded");
    await page.screenshot({ path: join(captures, "block-league-light.png") });
    await light.close();
  }

  for (const { name, enabled, settings, reducedMotion } of cases) {
    const capture = enabled && captures;
    const context = await browser.newContext({
      viewport,
      reducedMotion,
      ...(capture ? { recordVideo: { dir: temp, size: viewport } } : {}),
    });
    await seed(context, settings);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    const start = page.getByTestId("play-solo");
    await start.waitFor();
    if (capture) {
      await page.waitForFunction(() => document.fonts.status === "loaded");
      await page.screenshot({ path: join(captures, "block-league-dark.png") });
    }
    await start.click();
    const board = page.getByTestId("game-board");
    await board.waitFor();
    assert.equal(await page.getByTestId("line-clear-wave").count(), 0);
    const tray = page.getByTestId(`piece-${next.slot}`);
    await tray.click();
    await tray.getByText("Selected", { exact: true }).waitFor();
    await page.getByTestId(`cell-${next.row}-${next.col}`).click();
    await page.getByText(/Fits at row/).waitFor();
    if (capture)
      await page.screenshot({ path: join(captures, "block-league-board.png") });
    await trackClear(page);
    await page.getByTestId("confirm-place").click();
    await page
      .getByText(new RegExp(`cleared · \\+${updated.last.gain}`))
      .waitFor();
    assert.equal(
      await page.getByTestId("score-beat").innerText(),
      updated.score.toLocaleString(),
    );
    if (enabled) {
      await page.waitForFunction(() => window.clearWaveSeen === true);
      await page
        .getByTestId("line-clear-wave")
        .first()
        .waitFor({ state: "detached" });
    } else {
      assert.equal(await page.evaluate(() => window.clearWaveSeen), false);
    }
    await page
      .getByRole("button", { name: "Finish round", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Finish round", exact: true })
      .last()
      .click();
    await page.getByText("Round complete.", { exact: true }).waitFor();
    await page.getByText("New solo best", { exact: true }).waitFor();
    const tile = page.getByTestId("result-mark-tile");
    const tileTransform = await tile.evaluate((node) => node.style.transform);
    assert.equal(tileTransform.includes("translateY"), enabled);
    assert.deepEqual(errors, []);
    if (capture) {
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="result-mark-tile"]')
          ?.style.transform.includes("rotate(0deg)"),
      );
      await page.screenshot({
        path: join(captures, "block-league-result.png"),
      });
      await page.waitForTimeout(550);
      const video = page.video();
      await context.close();
      await video.saveAs(join(captures, "block-league-motion.webm"));
    } else {
      await context.close();
    }
    console.log(
      `PASS ${name}: playable, correct score and result, expected motion`,
    );
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
