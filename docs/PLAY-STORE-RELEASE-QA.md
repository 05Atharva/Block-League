# Block League Play Store release QA

27 November 2026 · Baseline candidate `47281ad`

## Fixes and release status

All three reproduced defects have fixes and regression checks. A fully enrolled season can start after its invite deadline. An expired, underfilled season releases its team locks. Completed seasons retain private roster snapshots so the same team can join a new season with different players. Async timers now finish only attempts that are still open.

Account deletion is available inside the app and from the standalone `/account-deletion` page. Confirmation revokes all sessions and the recovery key, clears profile and cloud data, and preserves shared results and replays under “Deleted player”. Devices with offline copies can remove the affected local profile without clearing other profiles.

The retest passed 39 engine, HTTP and server tests, TypeScript, lint, browser UI, interactions and motion. The complete release harness reran two-player Face-Off and the 24-account, 96-duel Championship. The confirmed-deletion, cancelled-deletion and standalone-page flows passed independently. The checked-in web export was rebuilt, and the Android store profile produced a JavaScript export with test HTTPS configuration.

**Public release approval remains pending.** The Android store profile requires HTTPS origins, requests an Android App Bundle, and hides development commerce. The production server expects an absolute storage path and blocks protected child signups and simulated rewards. Local Windows Android prebuild stalled during Expo's package refactor. A signed artifact, live hosting, Play Console declarations and physical Android acceptance still need verification. See the [release setup](PRODUCTION-INTEGRATIONS.md#android-store-build-and-account-deletion).

I tested the checked-in Expo web build against isolated local Node servers. The full-round run used independent touch-enabled Chromium phone sessions at 390 × 844. The broader suites also covered 320, 360 and 390 px layouts, 200% text, high contrast, dark mode, Marathi and Hindi, and keyboard dismissal. All accounts and tournament results were disposable.

## Solo and Face-Off

| Scenario | Evidence |
|---|---|
| Full Solo round | Finished by natural lockout after 26 placements and seven cleared lines, at 1,590 points. Reloaded midway and resumed. Checked each saved board and score, the final history entry, and that Play again reset the counter. |
| Full live Face-Off | Two independent browser users completed a match. The host reached 30 placements and 2,200 points. The guest locked out after 28 placements at 1,795 points. Both clients showed the same official result. Invite review, Ready, equal starting trays, a preset reaction, replay privacy and free rematch passed. |
| Integrity and recovery | An outsider could not read the match. The server refused a stale move sequence and an out-of-bounds placement. Existing tests passed for duplicate/retried actions, reconnect grace, expired invitations, removed guests, equal-score draws, and post-deadline submissions. |
| Async round and timeout | Verified offline drafting and later authoritative submission through the interaction suite. With an injected clock, the server accepted a move one millisecond before expiry, refused a new move at expiry, and finalised a no-show at zero. See QA-03 for the finish reason discrepancy. |

## Eight-team Championship

Eight teams of three distinct accounts completed 32 fixtures, 96 duels and 384 accepted placements. Two captains used the phone UI to create teams, approve requests, enter the season, cancel and then confirm the start, play a fixture, and inspect the standings and bracket. The remaining fixtures ran through authenticated HTTP clients against the same API. The bracket advanced in order through Qualifier 1, Eliminator, Qualifier 2 and the Final. Release Club 1 won with 14 points from its seven round-robin fixtures. Spectator denial, active roster locks and server-awarded badges passed.

The baseline league tests also exercise a full four-team Mini League, tied qualification, tied knockouts with a fresh captain-decider seed, and family fixture access after guardian approval and revocation.

## CTA and settings coverage

| Area | Activated or verified |
|---|---|
| Onboarding and practice | Invalid alias feedback, profile creation, family profile switching, Solo and Resume, guided tutorial, Beginner practice, hint, undo, Help, placement preview and confirmation, finish cancellation, family handoff, Play again. |
| Matches and sharing | Create live and async rooms, review invitation, confirm and cancel a join, copy private invite link, open a saved match, ready up, remove a waiting guest, reconnect, export result and achievement PNGs, review replays and free rematch. |
| Club | Create teams and seasons, copy a team code, request to join, approve and decline requests, report a team, enter and lock rosters, confirm and cancel the start, open and finish a fixture, refresh a season, and view completed standings and bracket. Championship enabled on the release harness and hidden under the normal default. |
| Account and guardian | Copied a recovery key, recovered into a separate local profile, and refreshed online progress. Tested PIN setup, a wrong PIN, private social access, external sharing approval, and revocation. |
| Settings and overlays | Appearance, 200% text, high contrast, dark, English/Hindi/Marathi, reduced motion, low effects, notifications, dismiss and focus return, quiet mode, timed mute, purchase-restoration status, and the cosmetic simulator's skip, failure, completion and opt-out actions. |

The browser pass covers the release-critical actions above. Native share sheets, Android link handoff, TalkBack, system back and interruption, vibration, performance and provider-backed purchase or ad actions need a device or configured environment.

The existing suite passed 36 engine, HTTP and server tests, 15 browser UI checks, seven interaction checks and four motion modes. TypeScript checks and both native Expo exports passed.

## Baseline defects and retest criteria

| ID | Severity | Reproduction and observed result | Expected result |
|---|---|---|---|
| QA-01 | P1 | Fill every slot in a four-team season without pressing Start. Advance the clock past registration close and open the season on a phone viewport. The page says registration is closed and the start action disappears. The same organiser can start the full season through the server API. | The organiser can start a full season after registration closes, or sees an explicit expiry state with a recovery path. The app and server enforce the same rule. |
| QA-02 | P1 | Complete a Championship, create a follow-up season, and try to enter the champion's existing team. The team still displays a locked roster, and the server rejects the entry. | A team can carry its existing roster into another season. Prior-season rosters and results stay intact. |
| QA-03 | P2 | In an async match, one player finishes before the deadline and the other never plays. At expiry, the completed player's reason changes from “Finished by player” to “Match window ended.” The official scores and winner still match the accepted moves. | Only the attempt that was still open receives the deadline reason. |

## Baseline release findings

- **Android release artifact and devices.** The Android and iOS Expo exports completed. There was no signed Android App Bundle, Android emulator, or connected Android phone available for this pass. Verify the signed bundle targets API 36 or higher and meets 16 KB page-size requirements, then test installation and the two-device flows from a Play test track. [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878) · [Google Play technical requirements](https://support.google.com/googleplay/android-developer/answer/17492799)
- **Production multiplayer.** Without a configured API URL, the native app defaults to `http://localhost:8787`. The release candidate needs a reachable HTTPS backend, production persistence and operational recovery, plus successful acceptance tests on that environment. [Client configuration](../app/src/storage.ts) · [Production integrations](PRODUCTION-INTEGRATIONS.md)
- **Account and family readiness.** The baseline had no deletion path. The fix adds both paths. Independently verify the hosted deletion page before entering its URL in Play Console. Resolve the declared target audience and complete the applicable child-inclusive review before exposing family social features publicly. [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111) · [Target audience and app content](https://support.google.com/googleplay/android-developer/answer/9867159)
- **Commerce.** Rewarded ads are simulated and Play Billing restoration reports unavailable. Keep commerce out of the public release scope until it passes provider-backed acceptance. [Production integrations](PRODUCTION-INTEGRATIONS.md)

## Reproduce

```powershell
npm test
npm run check
node --experimental-strip-types tests/release-qa.mjs
node --experimental-strip-types tests/release-qa.mjs --cta-only
npm run test:ui
npm run test:interactions
npm run test:motion
npm run build:native
```

Run `node --experimental-strip-types tests/release-qa.mjs --deadlines-only` for the shortened deadline and registration checks. The harness uses disposable accounts and prints the local screenshot directory.
