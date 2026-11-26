# Block League — playable development build v0.3

A real React Native + Expo game with a shared TypeScript puzzle engine, an authoritative Node server, private matches, replay review and team seasons. Source code and a prebuilt browser version are included.

**This is a development pilot, not a production-complete release of all 50 stories.** Every story has a traceable row in [docs/50-STORY-COVERAGE.md](docs/50-STORY-COVERAGE.md). Real ad delivery and store billing are not integrated. Guardian identity/age verification, full localisation and physical-device accessibility/performance checks remain release work. The app labels its simulated reward provider and unavailable purchase provider honestly.

## Fastest way to play

Install **Node.js 24 or newer**, unzip this folder, open a terminal inside `block-league`, and run:

```sh
npm run server
```

Open **http://localhost:8787**. The included `app/web-dist` runs without installing frontend dependencies. Create a local alias and play Solo. No account is needed for offline native solo play. In the browser, an initial page load is needed; this ZIP does not install a service worker for cold-start offline web access.

For two browser players, use separate browser profiles or a normal and private window. In each player's **You → Online account & recovery**, set the same server URL, then connect. Create a room, copy its code, join from the second player and ready up. This is real server-validated multiplayer, not an animated mock opponent.

## Expo Go on a phone

```sh
npm ci
npm --prefix app ci
npm --prefix app start
```

Scan the Expo QR code with a compatible Expo Go. The actual template generated for this build resolved to **Expo 58.0.23, React Native 0.88.1 and React 19.3.0**; the exact dependency graphs are in the two lockfiles. Do not independently upgrade React Native without the matching Expo upgrade process.

Solo, practice, tutorial and family duel work on-device without the game server. For online play, run this in another terminal:

```sh
node scripts/start-lan.mjs
```

Use your computer's LAN address in the phone's **You → Game server URL**, for example `http://192.168.1.100:8787`. Both devices must be on the same trusted Wi-Fi. `localhost` on a phone means the phone, not your computer. This command deliberately binds the pilot server to your LAN; do not expose it directly to the public internet.

You may alternatively set `EXPO_PUBLIC_API_URL` in `app/.env` before starting Expo. `app/.env.example` shows the format. No real account secrets are needed to start this development build.

## What works

- 8×8 board, three-piece trays, simultaneous row/column clears, combos, legal-move detection, lockout and replayable deterministic sequences.
- Colourful pieces from six-colour palettes. New pieces vary independently of scoring and shape generation. Placed blocks retain their colour; a player-selected theme can recolour the whole board consistently.
- Native custom placement spring, clear-cell shrink/rotation and score lift. Reduced motion respects the device setting; low-effects mode disables these effects. Sound is never required.
- Tap → destination → preview → confirm/cancel, plus drag-to-preview. Dragging does not silently commit a move.
- Three-move tutorial, untimed beginner practice, free practice hints/undo, solo autosave, earned stars/cosmetics and pass-and-play family duels.
- Separate local family profiles, private aliases, adult-only test reward offers, child social/sharing gates and PIN-protected guardian settings on the pilot server.
- Live Face-Off: identical sequences, 30 placements, 15-minute window, 60-second reconnect grace. Async duels: 24-hour window. Confirmed scores only; no competitive ad boosts, undo or revives.
- Preset reactions, host removal of unstarted guests, post-final opponent replay, largest-scoring-move jump, spoiler-free PNG result-card export and seed challenge links.
- Private three-person teams with captain approval, locked rosters, 4-team Mini Leagues and 8-team Championships. Round robin, published tie-breaks, qualification deciders, Qualifier 1, Eliminator, Qualifier 2 and Final. Only server-computed results advance a season.
- Reports stored for administrator review; private bearer-key account recovery; version-checked cloud backup of unverified personal progress separately from authoritative competitive results.
- Light/dark/high-contrast themes, patterns, 100–200% text sizes, Atkinson readability option, quiet mode, foreground break reminders and Hindi/Marathi core navigation/help.

## Tests and builds

```sh
npm ci
npm --prefix app ci
npm test
npm run simulate
npm run check
npm run build:web
npm run build:native
npx playwright install chromium
npm run test:ui
```

`npm test` uses Node's test runner. `simulate` plays 500 deterministic games and verifies all replays. `test:ui` starts its own temporary server and uses two separate browsers. `build:native` exports Android and iOS JavaScript/Hermes bundles; it does **not** create an APK/IPA or demonstrate execution on a physical phone.

See [docs/TEST-REPORT.md](docs/TEST-REPORT.md) and the machine-readable result files. UI screenshots created by the test are temporary test evidence, not user data shipped in this ZIP.

## Pilot backend and persistence

This runnable ZIP uses Node's built-in HTTP server, authenticated request/response calls with 1.5-second room polling, and an atomic JSON snapshot store. It intentionally does **not** require hosted Supabase or Colyseus to get started. This is a documented implementation change from the earlier proposed stack; it is not a claim that JSON storage is suitable for a scaled public game.

Server data is created in `data/block-league.json`. **Only run one server process per data file.** Do not run a moderation-writing command while that server is running. Keep and back up this file to retain accounts, moves, teams and seasons. There are no bundled real accounts or secrets.

A recovery key is an unguessable bearer credential. Possession restores that account's server records and last cloud backup. It is not email/phone identity verification. Local, assisted and verified records remain distinct. Cloud revisions reject stale overwrites instead of merging another profile. The native pilot stores the session in AsyncStorage; migrate credentials to secure storage before release.

Moderation (server owner, locally):

```sh
node --experimental-strip-types server/reports.ts
# Stop the running server before resolving a report in this single-process pilot.
node --experimental-strip-types server/reports.ts resolve REPORT_ID
```

## Ad and purchase boundary

There are **no real ads or charges** in this package. The optional adult cosmetic flow tests offer/complete/skip/failure/idempotent grant, with server test mode disabled by default. To exercise it locally, set `ALLOW_TEST_REWARDS=1` when starting the server, then open **You → Cosmetic studio**. It is explicitly marked a developer simulation. Never enable that switch in production.

The “Check purchase restoration” action reports that store billing is unavailable. It cannot purchase or restore a paid entitlement. **US-37 is not implemented.** Ad delivery in **US-28/US-36** remains an integration task. These are real gaps, not merely missing app IDs. Native billing/ads require an Expo development build and configured providers, verified receipts/rewards, appropriate age/consent flows and store sandbox tests. See [docs/PRODUCTION-INTEGRATIONS.md](docs/PRODUCTION-INTEGRATIONS.md).

## Design reference

[Figma: UI design principles](https://www.figma.com/resource-library/ui-design-principles/) informed hierarchy, progressive disclosure, consistency, contrast, accessibility, proximity and alignment. [docs/DESIGN-AND-MOTION.md](docs/DESIGN-AND-MOTION.md) maps these to concrete components and animation behaviour.

The source is formatted, editable TypeScript. No generated image is required for gameplay; the brand mark and blocks are original geometric assets. Font licenses are in `docs/licenses`.
