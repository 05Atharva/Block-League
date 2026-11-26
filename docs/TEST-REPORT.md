# Validation report — 5 November 2026

## Interaction and story coverage pass

- `npm test` covers atomic offline async submission, idempotent retry, rejection after a deadline, and protection of live matches in addition to the original engine and server suite.
- `npm run test:interactions` checks toast dismissal and live-region semantics, keyboard focus restoration, cancellable finish and help overlays, the notification drawer at 320 px with 200% text and at desktop width, timed quiet preferences, and offline reload and reconnection through a result notification.
- `npm run test:ui` checks guest-removal cancellation and the leave-match warning in the two-player path. The [coverage matrix](50-STORY-COVERAGE.md) records all 50 stories and outstanding release acceptance.

## Results

| Check | Result | What this establishes |
|---|---|---|
| Node engine/server/HTTP/league suite | 30 passed, 0 failed | Legal placement, scoring, state replay, authoritative rooms, privacy, recovery, reporting, reward simulation and season progression. |
| Seeded game simulation | 500 games; 6,536 placements; zero invalid states; zero replay mismatches | Reproducibility and core invariants under a deterministic legal-move policy. |
| Browser UI checks | 12 passed | Actual React Native Web flows, including two isolated browser players. |
| Frontend TypeScript | Passed, strict | App and shared engine type checking. |
| Backend TypeScript | Passed, strict | Server and shared rules type checking. |
| Web export | Passed | Runnable browser build included in `app/web-dist`. |
| Android export | Passed | Hermes/JS bundle generation; not an installed APK test. |
| iOS export | Passed | Hermes/JS bundle generation; not an installed IPA test. |

## UI coverage actually executed

1. Create a profile and reach Play in one tap.
2. Select a piece, preview a legal cell, confirm placement and see score/progress change.
3. Reload the browser and resume the last saved solo move.
4. Request a free practice hint, place it, then undo.
5. Complete all three guided tutorial placements.
6. Render 200% text settings at widths 320, 360, 390 and 768 without document horizontal overflow.
7. Switch Hindi/Marathi settings and verify Devanagari labels.
8. Complete a two-player family handoff with equal first pieces and a correctly tied result.
9. Export a genuine PNG and inspect its file signature and 1080×1350 dimensions.
10. Switch family profiles without copying progress; confirm the child profile has no reward-ad offer.
11. In two independent browser processes: create/join a live room, ready, play, finish and view both final replays.
12. Verify no uncaught browser runtime errors in those flows.

The primary local Chromium launcher failed in this execution environment. A Chromium headless-shell package from the npm registry successfully rendered the app. Tests used two separate browser processes to avoid the renderer's single-process context-storage limitation. The UI test accepts `CHROME_MODULE` for that runner; on a normal development computer, `npx playwright install chromium` and `npm run test:ui` use the standard browser.

## Simulation interpretation

The simple test policy reached the 30-placement cap in 4 of 500 games; 496 locked out sooner. Mean score was 599. This policy is deliberately not an optimal solver, a human playtest or evidence of good difficulty balance. The result validates state/rule consistency, not retention, monetisation, fun or solvability of every random board.

## Important untested acceptance conditions

- Actual Expo Go execution, physical Android/iOS gestures, share sheets, deep links, haptics, VoiceOver/TalkBack and OS reduced-motion events.
- Budget-phone frame pacing, battery, memory, touch comfort and long-session stability.
- Real advertising load/completion/signature verification, store purchases or restoration. The simulator does not count as ad integration.
- Production guardian/age verification, account operations and public-deployment security/load review.
- Native-speaker translation validation and complete localisation of secondary/dynamic messages.
- 50/50 story acceptance: explicitly **not claimed**. Read the status matrix.

## Reproduce

See the README test commands. Raw successful output is in `automated-test-output.txt`, `typecheck-output.txt` and `ui-test-output.txt`. Machine-readable reports are `simulation-results.json` and `ui-test-results.json`. A test that cannot run on a physical device here is listed as pending, not marked passed by source inspection.
