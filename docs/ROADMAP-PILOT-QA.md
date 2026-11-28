# Block League roadmap pilot QA

28 November 2026 · Phone-sized Chromium and local server

## Feature QA

| Flow                  | Coverage                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classic               | One-tap resume, confirmed placement, reload, natural lockout, replay, and a fresh round. Confirmed Open Table leaves the saved Classic board intact.                                                                                                                                                                                                                        |
| Journey and cosmetics | Completed each of the six authored boards through the UI, previewing and confirming every hinted placement. Equipped Trailblazer and applied Monsoon Tile and Kiln & Clay. Checked reward rules and locks.                                                                                                                                                                  |
| Daily Puzzle          | Finished a previously issued board offline. A failed verification preserved the solve and retry credited exactly one tile. Checked archive practice, the missed-day reset, and a protected profile earning an offline practice tile. The rules suite checked 1,095 generated puzzles, mixed difficulties, account-specific assignments, two-session retries, and deadlines. |
| Awards and friends    | Connected two independent adult profiles with a one-use code. Inspected sharing off, opt-in streak visibility, and revoked access. Checked cancel and confirm on friend removal. Server tests covered seven- and thirty-day history, permanent earned awards, unverified award rejection, outsider access, and deletion.                                                    |
| Weekly Board          | Finished a board from the UI, verified the score, and observed what the connected friend could see before and after revocation. Verified that current-board replay goes to practice. Tested stale and unfinished submissions and independently replayed the score on the server.                                                                                            |
| CPU Duel              | Completed a full match after a mid-match reload, reviewed CPU moves, and started a rematch. Checked equal seeds and independent boards. Policies replayed deterministically across 30 fixed seeds per tier, with increasing median scores.                                                                                                                                  |
| Open Table            | Cancelled closing a chapter, confirmed it, and started chapter two. The independent save retained the completed chapter and the Classic board stayed resumable.                                                                                                                                                                                                             |

## Visual and interaction QA

- Reviewed phone-width screenshots at 390 px in Club Light and Night Club. Inspected Play and Resume, the Daily map, result feedback, Collection, friend visibility, the Weekly Board, the CPU picker, in-game board and replay, and Open Table.
- Checked 320 px with high contrast and 200% text. Verified that the navigation and board fit the viewport, and that keyboard selection, preview and confirmation stayed available.
- Replaced wrapping puzzle navigation with a compact layout and a large-text menu. Moved notifications out of the control path in the new screens. Confirmed the Weekly Board action updates immediately after score verification.
- A Chromium touch drag could suppress the next confirmation click. Placement now uses the deliberate touch release, with duplicate click handling. The interaction test exercises both a missing click after a drag and ordinary touch confirmation.
- The motion regression suite ran with system reduced motion, in-app motion disabled, and low effects. Screenshots captured static reward feedback with reduced motion enabled.

## Competition regressions

- Two independent browser clients completed a live Face-Off to final scores and replay.
- The Championship harness exercised eight teams and 24 accounts across 32 fixtures and 96 duels. It verified advancement, champion, badges and roster snapshots. The full bracket was exercised through the server harness.
- Ran the checked-in browser UI, motion, interaction, and release QA suites. The [50-story coverage matrix](50-STORY-COVERAGE.md) continues to track the original release stories.

## Release decision

The pilot passed its browser and server checks. Android and iOS JavaScript bundles exported successfully. Physical Android touch, TalkBack, haptics, low-end frame pacing, and a two-device staging pass remain open for Play Store sign-off. Player sessions still need to confirm the 3–5 minute target and how often players return to the map.

Re-run the roadmap browser suite after `npm run build:web` with `node --experimental-strip-types tests/puzzles-ui.mjs`. It writes screenshots to a temporary directory and prints the path.
