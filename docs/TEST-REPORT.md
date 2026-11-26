# Block League validation report

## Mobile defect retest — 26 November 2026

All nine defects from the first mobile QA run were resolved on the tested browser surface. The retest used the rebuilt web export, a touch-enabled Chromium phone viewport, and an isolated local server.

| ID | Retest result |
|---|---|
| M-01 | The family handoff is opaque. The browser test verifies that the first board and Player 1’s score label are absent from the rendered screen. |
| M-02 | At 320 px and 200% text the header uses a dedicated title line. Cancel and Place block stack. The retest checks title height and actual label bounds. |
| M-03 | A fresh browser profile opens the original seed challenge immediately after setup. |
| M-04 | The invite dialog shows the mode, duration, placement count and invitation expiry before confirmation. The server test verifies zero seat changes and no board data in the preview. |
| M-05 | A removed guest sees a recovery screen with no Ready action. After rejoining the same code, an API interruption shows Reconnecting and recovery restores the board. |
| M-06 | A phone-emulated touch drag selects the expected cell and leaves the placement count unchanged until confirmation. |
| M-07 | The 25-character test name is preserved. Over-limit names are rejected, and the copy action disappears when registration closes. |
| M-08 | Unavailable billing uses the informational Notice status. |
| M-09 | Marathi counters and the legal-destination preview use Marathi. Hindi and Marathi templates also cover line clears and board accessibility labels. |

The pilot also passed a real upcoming-challenge mute test and a guardian-approved private family-league integration test. The latter exercises invitation, fixture access, outsider denial and revocation.

### Updated acceptance across all 50 stories

The eight Issue rows in the historical review were retested. US-11, US-13, US-14, US-21, US-35 and US-41 passed on the tested surface. US-25 and US-49 moved to Partial because their browser defects passed and broader acceptance remains open. The new evidence moves US-20 and US-47 to Pass at pilot scope. The resulting total is **40 passed, 8 partial and 2 blocked**. [Story-by-story coverage](50-STORY-COVERAGE.md)

| Remaining stories | Acceptance still required |
|---|---|
| US-06, US-10 | Verified production guardian identity and consent, and device-level parental enforcement |
| US-25, US-46 | Physical-device verification of the native share sheet, system reduced motion and vibration |
| US-28, US-36 | Live ad provider, consent flow, validated reward delivery and ad placement |
| US-37 | Configured store products, verified receipts and real sandbox restoration |
| US-38 | Production verified identity and recovery on real devices |
| US-39 | Frame-pacing and responsiveness measurements on representative budget Android hardware |
| US-49 | Remaining secondary strings and native-speaker review |

## Manual mobile-screen QA — 26 November 2026

**Build** `b016227` · **Scope** portrait, touch-enabled Chromium running the checked-in React Native Web export against an isolated local server.

I inspected 320 × 640, 360 × 780, 390 × 844 and 430 × 932 viewports. The session covered light, dark, high contrast, patterned blocks, 100% and 200% text, and Hindi and Marathi. I tapped the actual rendered interfaces and inspected screenshots at checkpoints. Replays, recovery and live/async play used independent browser profiles. Seeded accounts and server-generated league and line-clear fixtures shortened setup. The reminder exercise used an accelerated preference in a disposable profile. All game activity and reports stayed on the local QA server.

No phone or installed emulator was available. The results below cover the mobile browser surface. Native gestures, real screen readers, vibration, the platform share sheet, budget-phone performance and store-provider flows require separate acceptance.

### Verdict

32 stories passed on the tested surface, 8 had a visible issue, 8 had partial acceptance, and 2 were blocked. A browser pass can include supporting engine or server checks where a rule is invisible on the screen. An issue means the observed behaviour missed an acceptance condition or materially affected that story. Partial means some behaviour worked and an acceptance condition remains open.

The independent regression run passed all 32 Node tests, TypeScript, 12 browser UI checks, four browser interaction checks and four motion modes. Those passes did not catch the mobile visual defects below.

### Defects reproduced

| ID | Priority | Mobile reproduction and observed result | Screenshot |
|---|---|---|---|
| M-01 | P2 | Finish Player 1’s Family Duel attempt. The handoff says the attempt is hidden while the translucent backdrop exposes the board, score and placement count. Player 2 should receive a private handoff. | `15-family-handoff.png` |
| M-02 | P2 | At 320 px, turn on 200% text and open settings and Solo. The header splits words across six lines, occupies nearly half the viewport, and Cancel extends outside its button into the neighbouring action. The Help dialog still fits and dismisses. | `17-settings-320-200pct.png`, `18-board-320-high-contrast.png` |
| M-03 | P2 | Open a copied challenge link on a fresh browser profile, enter an alias and tap Let’s play. Home appears and the invite state is lost. Opening the same link a second time reaches the correct seed challenge. | `10-challenge-after-first-run.png`, `11-challenge-existing-profile.png` |
| M-04 | P2 | Enter a private invitation code on Play with friends. The Join action gives no preview of the specific room’s mode, placement limit or deadline. Those details appear in the lobby after joining. | `22-invite-no-limit-preview.png`, `24-guest-removal-confirmation.png` |
| M-05 | P2 | Remove a waiting guest, then let the same guest rejoin the same code. The removed session initially retains an enabled Ready action. After the rejoin, temporarily interrupt the guest’s API. The pause panel says “This room is private” even though reconnection restores the confirmed board. | `26-removed-guest-stale-lobby.png`, `28-live-reconnect-stale-error.png` |
| M-06 | P3 | In touch-enabled Chromium drag a tray piece to a known legal destination from the saved line-clear fixture. Two attempts produced no selection or preview. The same destination worked by tapping and still required confirmation. Native drag remains open. | `57-touch-drag-retry.png`, `51-clear-confirmation.png` |
| M-07 | P3 | Create a league with the 25-character name “Mobile QA Six Hour Season”. The UI accepts the input and renders the name without its last letter. After starting a league, the Playing screen still presents a future registration deadline and a Copy league code action. | `56-new-season-on-mobile.png`, `40-mobile-standings.png` |
| M-08 | P3 | Tap Check purchase restoration. The body correctly explains that billing is unavailable, but the toast is styled and labelled Success. | `49-billing-unavailable.png` |
| M-09 | P3 | Switch to Marathi and preview a legal placement. The score counters and “Fits at row 1, column 1” remain English. The equivalent settings and actions rendered in Devanagari. | `59-marathi-english-preview.png`, `20-hindi-dark.png`, `21-marathi-dark.png` |

### All 50 story verdicts

| ID | Verdict | Evidence and remaining acceptance |
|---|---|---|
| US-01 | Pass | Completed all three guided placements using Show a fitting move. The tutorial finished with a clear result and was replayable. |
| US-02 | Pass | Played an untimed Beginner practice round while the API was unavailable. The board displayed Assisted · unranked. |
| US-03 | Pass | Inspected occupied cells in patterned and High contrast modes. Symbols and cell boundaries distinguish pieces alongside colour. |
| US-04 | Pass | Switched local profiles and saw independent progress. Recovery into a separate browser profile preserved both local identities. |
| US-05 | Pass | Earned five stars from completed rounds. The Garden party card offered Use palette without a purchase or ad. |
| US-06 | Partial | A child test profile was refused social play before PIN approval, then opened a private room after approval. Production guardian identity and consent remain open. |
| US-07 | Pass | Sent Nice move! from one mobile browser and saw it in the other. The match exposed preset buttons. |
| US-08 | Pass | The practice hint showed a legal preview and Undo restored the prior state. Ranked play offered neither hint nor undo. |
| US-09 | Pass | Canceled Finish round, then completed a round and left from the result screen. Earned stars and progress persisted. |
| US-10 | Partial | Set a pilot guardian PIN, enabled private social play and changed a child’s reminder. Device-level enforcement and verified guardian identity remain open. |
| US-11 | Issue | A valid eight-character code joined, an invalid code produced an error, and host removal succeeded. The removed guest retained a stale lobby with an enabled Ready action. See M-05. |
| US-12 | Pass | Two independent phone viewports showed the same starting tray. The same placement produced 40 points on each; server replay checks passed. |
| US-13 | Issue | The mode cards state general live and async durations. Pasting a code gives no room-specific terms or expiry before the Join action. See M-04. |
| US-14 | Issue | A temporary API interruption paused play and the confirmed piece returned on reconnect. The same-code rejoin sequence showed a stale privacy error during the later outage. See M-05. |
| US-15 | Pass | Opponent replay stayed unavailable until both attempts finished. The highest-scoring clear shortcut opened move 4 with +140 points in a played fixture. |
| US-16 | Pass | Created a team, submitted a join request from another mobile session and approved it. The pending player appeared in the roster only after approval. |
| US-17 | Pass | Profiles and teams were labelled private, setup used aliases, and an outsider failed to join a closed room. Server membership assertions also passed. |
| US-18 | Pass | Played offline practice and an eligible async attempt. The queued draft survived reload, was verified after reconnect and contributed once to the final score. |
| US-19 | Pass | Observed a First Clear badge after a clearing move and a Server verified Clean Duel badge after a real match. The profile showed the badge rules. |
| US-20 | Partial | The one-hour mute survived reload and could be resumed from the profile. A real near-deadline competition reminder under mute and background push were outside this run. |
| US-21 | Issue | Created a league at phone width and saw the code, roster limit and deadline. The UI silently shortened an accepted name and continued advertising registration after play started. See M-07. |
| US-22 | Pass | Confirmed entry with a locked three-player roster. Season copy disclosed the substitution rule and automated server tests rejected post-lock edits. |
| US-23 | Pass | Inspected the mobile standings and published order for tie-breaks. Equal-record resolution was covered by the server suite. |
| US-24 | Pass | Inspected a completed eight-team fixture generated through the real server rules. The scrollable mobile bracket showed Qualifier 1, Eliminator, Qualifier 2 and Final. |
| US-25 | Issue | The preview and 1080 × 1350 PNG exported, and the clipboard link opened the same seed for an existing profile. First-time setup dropped the challenge. Native share remains open. See M-03. |
| US-26 | Pass | Both boards advanced to the same selected replay step. They stacked at 360 px and remained individually readable. |
| US-27 | Pass | Created a private async challenge, completed the two attempts at different times, and saw equal scores from the same opening move. |
| US-28 | Partial | The test-provider offer disclosed the Aurora reward, allowed a voluntary decline, and reported a simulated completion. Live ads and provider verification remain open. |
| US-29 | Pass | The ranked UI omitted undo, reroll and revive. Server tests rejected competitive tools and invalid moves. |
| US-30 | Pass | Submitted a report from the mobile replay and saw the confirmation toast. Server tests covered persistence and rate limits. |
| US-31 | Pass | Placed one piece, reloaded, tapped Resume Solo and saw the same occupied cells and 40-point score. |
| US-32 | Pass | Completed play without relying on audio. Visible hints, overlap feedback, line clears, reconnect state, results and toasts conveyed the outcomes. |
| US-33 | Pass | Play exposed untimed Solo and a route to live and async choices. Invite-specific terms are covered by M-04. |
| US-34 | Pass | Created a six-hour season and inspected a concrete deadline on a scheduled fixture. Server tests covered expiry. |
| US-35 | Issue | Both turns received the same pieces and the result was marked unranked. Player 1’s board and score remained visible through the handoff scrim. See M-01. |
| US-36 | Partial | Declining a simulated reward returned to Play and no ad appeared over the board. Live ad placement and lifecycle remain open. |
| US-37 | Blocked | The restoration control said billing was unavailable. A store product, receipt verification and real restoration are required. See M-08 for the toast treatment. |
| US-38 | Partial | A private recovery key restored 100 Solo points, the 40-point verified record and five stars into a separate profile. Verified identity and real-device recovery remain open. |
| US-39 | Blocked | Low effects was exercised in the browser. Representative budget Android hardware and frame pacing still require measurement. |
| US-40 | Pass | An accelerated reminder fixture produced a dismissible toast and an inbox item. Dismissal preserved the saved board and earned stars. |
| US-41 | Issue | The app fit the browser’s 320 px document width, but the 200% title split letters and Cancel visibly spilled outside its button. See M-02. |
| US-42 | Pass | Inspected high-contrast black and white boundaries with occupied-cell symbols during play. Physical assistive-technology checks remain open. |
| US-43 | Pass | Used touch-emulated taps for select, preview, confirm and cancel. The optional drag path failed under touch emulation. See M-06. |
| US-44 | Pass | Solo and practice were untimed and async was available separately from Live Face-Off. |
| US-45 | Pass | Opened and dismissed help from a saved Solo board. Placement and score stayed intact, and the tutorial was replayable from Play. |
| US-46 | Partial | Toggled Custom animations and Low effects on the mobile surface. All four automated browser motion modes passed. Native system settings and vibration remain open. |
| US-47 | Partial | Inspected the private team entry, roster lock and league interface. Invited-family participation in a complete season and production guardian approval were outside this run. |
| US-48 | Pass | The profile showed separate unassisted Solo, assisted practice and verified competitive totals and restored them on recovery. |
| US-49 | Issue | Hindi and Marathi settings and Devanagari rendered. The Marathi board retained English score counters and legal-move feedback. See M-09. |
| US-50 | Pass | Reached Solo or Resume in one tap after profile setup. Friends, Club and You stayed separately reachable. |

## Earlier validation runs

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
