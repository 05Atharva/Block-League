import { chromium } from "playwright";
import { startServer } from "../server/index.ts";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { once } from "node:events";
const temp = mkdtempSync(join(tmpdir(), "block-league-ui-"));
const { server } = startServer({ port: 0, file: join(temp, "data.json") });
await once(server, "listening");
const port = server.address().port,
  base = `http://127.0.0.1:${port}`;
let browser, browser2, debugPage;
const checks = [],
  errors = [];
const ok = (name) => {
  checks.push(name);
  console.log("PASS", name);
};
try {
  const launch = { headless: true };
  if (process.env.CHROME_MODULE) {
    const { default: c } = await import(process.env.CHROME_MODULE);
    launch.executablePath = await c.executablePath();
    launch.args = c.args;
  }
  browser = await chromium.launch(launch);
  browser2 = await chromium.launch(launch);
  const a = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    b = await browser2.newContext({ viewport: { width: 390, height: 844 } });
  const page = await a.newPage(),
    guest = await b.newPage();
  debugPage = page;
  for (const p of [page, guest]) {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
  }
  async function profile(p, alias) {
    debugPage = p;
    await p.goto(base);
    await p.getByLabel("Choose an alias").fill(alias);
    await p.getByRole("button", { name: "18-24", exact: true }).click();
    await p.getByRole("button", { name: "Let’s play", exact: true }).click();
    await p.getByTestId("play-solo").waitFor();
  }
  await profile(page, "UI Player");
  ok("Profile creation and one-tap Play");
  await page.screenshot({ path: join(temp, "home.png"), fullPage: true });
  await page.getByTestId("play-solo").click();
  await page.getByTestId("piece-0").click();
  await page.getByTestId("cell-0-0").click();
  assert.equal(await page.getByTestId("confirm-place").isEnabled(), true);
  await page.getByTestId("confirm-place").click();
  await page.getByText("1 placed", { exact: true }).waitFor();
  ok("Tap, legal preview, confirmed placement and score update");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.reload();
  await page.getByTestId("play-solo").waitFor();
  assert.match(await page.getByTestId("play-solo").innerText(), /Resume/);
  await page.getByTestId("play-solo").click();
  await page.getByText("1 placed", { exact: true }).waitFor();
  ok("Autosave survives a complete page reload");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: "Beginner practice", exact: true })
    .click();
  await page.getByRole("button", { name: "Free hint", exact: true }).click();
  await page.getByTestId("confirm-place").click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByText("0 placed", { exact: true }).waitFor();
  ok("Free practice hint and undo");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: "Learn to play", exact: true })
    .click();
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Show a fitting move", exact: true })
      .click();
    await page.getByTestId("confirm-place").click();
  }
  await page.getByText("You’re ready to play.", { exact: true }).waitFor();
  ok("Three-placement guided tutorial completes");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: "Profile and settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Accessibility & appearance", exact: true })
    .click();
  await page.getByRole("button", { name: "200%", exact: true }).click();
  await page
    .getByRole("button", { name: "High contrast", exact: true })
    .click();
  for (const w of [320, 360, 390, 768]) {
    await page.setViewportSize({ width: w, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow at ${w}`,
    );
  }
  ok("Settings layout at 200% text and 320 / 360 / 390 / 768 widths");
  await page.getByRole("button", { name: "100%", exact: true }).click();
  await page.getByRole("button", { name: "Club Light", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "हिन्दी", exact: true }).click();
  assert.ok(
    await page.getByText("अक्षरों का आकार", { exact: true }).isVisible(),
  );
  await page.getByRole("button", { name: "मराठी", exact: true }).click();
  assert.ok(
    await page.getByText("अक्षरांचा आकार", { exact: true }).isVisible(),
  );
  await page.getByRole("button", { name: "English", exact: true }).click();
  ok("Hindi and Marathi core settings render with Devanagari");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Family duel", exact: true }).click();
  const firstShape = await page
    .getByTestId("piece-0")
    .getAttribute("aria-label");
  await page.getByTestId("piece-0").click();
  await page.getByTestId("cell-0-0").click();
  await page.getByTestId("confirm-place").click();
  await page.getByRole("button", { name: "Finish round", exact: true }).click();
  await page
    .getByRole("button", { name: "Finish round", exact: true })
    .last()
    .click();
  await page.getByText("Pass the phone.", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Player 2 — I’m ready", exact: true })
    .click();
  assert.equal(
    await page.getByTestId("piece-0").getAttribute("aria-label"),
    firstShape,
  );
  await page.getByTestId("piece-0").click();
  await page.getByTestId("cell-0-0").click();
  await page.getByTestId("confirm-place").click();
  await page.getByRole("button", { name: "Finish round", exact: true }).click();
  await page
    .getByRole("button", { name: "Finish round", exact: true })
    .last()
    .click();
  await page.getByText("A friendly draw", { exact: true }).waitFor();
  ok("Family handoff hides first attempt and gives identical pieces");
  await page
    .getByRole("button", { name: "Save result card", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save / share PNG", exact: true })
    .click();
  const download = await downloadPromise;
  const png = readFileSync(await download.path());
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1080);
  assert.equal(png.readUInt32BE(20), 1350);
  ok("Real PNG result card exports at 1080×1350");
  await page
    .getByRole("button", { name: "Profile and settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add local profile", exact: true })
    .click();
  await page.getByLabel("Choose an alias").fill("Family Test");
  await page.getByRole("button", { name: "7-12", exact: true }).click();
  await page.getByRole("button", { name: "Let’s play", exact: true }).click();
  assert.match(await page.getByTestId("play-solo").innerText(), /Play Solo/);
  await page
    .getByRole("button", { name: "Profile and settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cosmetic studio", exact: true })
    .click();
  assert.equal(
    await page
      .getByText("Optional cosmetic reward · developer test", { exact: true })
      .count(),
    0,
  );
  await page
    .getByRole("button", { name: "Profile and settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "UI Player · 18-24", exact: true })
    .click();
  assert.match(await page.getByTestId("play-solo").innerText(), /Resume/);
  ok(
    "Family profiles keep progress separate; child profile has no reward-ad offer",
  );
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: "Profile and settings", exact: true })
    .click();
  await page.getByLabel("Game server URL").fill(base);
  await page
    .getByRole("button", { name: "Create private online account", exact: true })
    .click();
  await page.getByText("Online account connected.", { exact: true }).waitFor();
  await profile(guest, "UI Friend");
  await guest
    .getByRole("button", { name: "Profile and settings", exact: true })
    .click();
  await guest.getByLabel("Game server URL").fill(base);
  await guest
    .getByRole("button", { name: "Create private online account", exact: true })
    .click();
  await guest.getByText("Online account connected.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: "Play with friends ↗", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create live room", exact: true })
    .click();
  await page.getByText("PRIVATE ROOM", { exact: true }).waitFor();
  const code = (await page.locator("body").innerText()).match(
    /\b[A-F0-9]{8}\b/,
  )[0];
  await guest.getByRole("button", { name: "Home", exact: true }).click();
  await guest
    .getByRole("button", { name: "Play with friends ↗", exact: true })
    .click();
  await guest.getByLabel("Invitation code").fill(code);
  await guest
    .getByRole("button", { name: "Join private room", exact: true })
    .click();
  await guest.getByRole("button", { name: "I’m ready", exact: true }).click();
  await page.getByRole("button", { name: "I’m ready", exact: true }).click();
  await page.getByTestId("game-board").waitFor();
  await guest.getByTestId("game-board").waitFor();
  for (const p of [page, guest]) {
    await p.getByTestId("piece-0").click();
    await p.getByTestId("cell-0-0").click();
    await p.getByTestId("confirm-place").click();
    await p.getByRole("button", { name: "Finish round", exact: true }).click();
    await p
      .getByRole("button", { name: "Finish round", exact: true })
      .last()
      .click();
  }
  await page.getByText("Official result · final", { exact: true }).waitFor();
  await guest.getByText("Official result · final", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Review both attempts", exact: true })
    .click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  assert.equal(await page.getByTestId("game-board").count(), 2);
  ok(
    "Two browser clients create/join, ready, play, finalise and view both replays",
  );
  await page.screenshot({ path: join(temp, "replay.png"), fullPage: true });
  assert.deepEqual(errors, []);
  ok("No browser runtime errors");
  mkdirSync("docs", { recursive: true });
  writeFileSync(
    "docs/ui-test-results.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        passed: checks,
        errors,
        renderer: "Chromium, Expo React Native Web export",
        notTested: [
          "Android/iOS physical touch and assistive technology",
          "Budget-device frame rate",
          "Production ads, billing and identity providers",
        ],
      },
      null,
      2,
    ),
  );
  console.log("Temporary screenshots:", temp);
} catch (e) {
  console.error(e);
  if (debugPage) {
    await debugPage.screenshot({
      path: join(temp, "failure.png"),
      fullPage: true,
    });
    console.log("Failure screenshot:", join(temp, "failure.png"));
    console.log(
      await debugPage.evaluate(() =>
        Array.from(document.querySelectorAll("*"))
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => ({
            text: e.textContent.slice(0, 90),
            tag: e.tagName,
            w: e.getBoundingClientRect().width,
            x: e.getBoundingClientRect().x,
          }))
          .slice(-20),
      ),
    );
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  await browser2?.close();
  await new Promise((r) => server.close(r));
}
