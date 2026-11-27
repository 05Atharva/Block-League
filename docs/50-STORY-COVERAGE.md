# All 50 user stories — implementation and acceptance matrix

All 50 stories were audited against the pilot. The mobile retest closed all nine reproduced defects. [The QA report](TEST-REPORT.md) records the current verdicts, provider dependencies, and physical-device acceptance still required.

| Story | Feature / intended outcome | Status | Implementation and evidence |
|---|---|---|---|
| US-01 | Interactive tutorial | Implemented | Tutorial: select, preview, confirm three moves; help is replayable. UI: guided tutorial completes. |
| US-02 | Beginner practice | Implemented | Separate untimed beginner generator; practice is labelled assisted/unranked. Engine simple-pieces and UI practice tests. |
| US-03 | Pattern mode | Implemented; device QA pending | Cell symbols + boundaries in pattern/high-contrast mode. Code and browser inspection; physical vision/colour-blind usability pending. |
| US-04 | Family profiles | Implemented | Profile-scoped saved game, settings, history, stars and records. Storage round-trip and profile-switch UI checks. |
| US-05 | Earned cosmetics | Implemented | A completed round with at least three placements earns stars; Garden at five. Code rules; no payment or ad path required. |
| US-06 | Protected rooms | Pilot implementation | Private rooms require guardian approval for child profiles. Revoking approval blocks access to active rooms. Mobile PIN flow and server invite/revocation tests. Guardian identity and consent verification remain external. |
| US-07 | Preset reactions | Implemented | Allowlisted reactions only; no free-text chat, DMs or photo upload. Preset/rate-limit server tests. |
| US-08 | Practice hints | Implemented | Free practice hint; no ranked help/undo control. Practice UI and ranked-integrity server tests. |
| US-09 | Round completion | Implemented | Finish confirmation is cancellable. Round result and voluntary exit preserve earned progress. Tutorial/results UI and interaction checks. |
| US-10 | Guardian controls | Pilot implementation | PIN-gated online social and sharing settings and child reminder changes. Current social approval is visible in the profile. Mobile guardian controls and server revocation checks. Device-level parental enforcement remains open. |
| US-11 | Room codes | Implemented | Expiring eight-character room codes and direct invite links. A link survives first-run setup and previews terms before claiming a seat. Hosts can remove a waiting guest. Browser link, preflight, host removal and same-code rejoin checks. Native link handoff still needs device acceptance. |
| US-12 | Deterministic face-off | Implemented | One shared versioned seed/shape/scoring engine and authoritative replay. 500 simulations plus two-client HTTP/UI tests. |
| US-13 | 30-placement duel | Implemented | The pre-join review provides room type, invitation expiry, match window and placement limit before claiming a seat. Browser invitation dialog plus server tests that preview is read-only, gated, and respects expiry. |
| US-14 | Reconnection | Implemented | Live reconnect restores authoritative state within the grace period. A successful same-code rejoin clears stale access errors. Browser reconnect after guest removal plus server grace-period tests. |
| US-15 | Post-match replay | Implemented | Move-by-move post-final replay and largest scoring move jump. Replay equality and two-client replay UI checks. |
| US-16 | Teams | Implemented | Private team codes, captain-approved requests, three-player cap. Team membership/roster tests. |
| US-17 | Privacy controls | Implemented | Aliases and authenticated membership checks; private by default. Outsider access and recovery isolation tests. |
| US-18 | Offline practice | Implemented in the pilot | Native offline practice and Solo remain unranked. An opened private async challenge can queue moves and finish offline. The server applies the batch atomically against the confirmed board before the deadline. Browser disconnect/reload/reconnect check plus atomicity, retry and expiry tests. |
| US-19 | Skill badges | Implemented | Server-verified First/Cross/Five-Clear/Clean Duel/Team Contributor/League Champion badges. Local badges are labelled. Verified badge cards show only the sharer’s alias. Engine badge checks, league awards and browser PNG export. |
| US-20 | Quiet hours | Implemented for in-app reminders | Per-profile quiet mode and one-hour mute cover break and deadline reminders. The foreground inbox remains available for match results. A browser test exercised a real upcoming async deadline while muted and after resuming. |
| US-21 | League creation | Implemented | Private 4- and 8-team leagues support up to 40 characters in season names. Invitation expiry closes signups. A filled league can still start after that deadline. Browser late-start and server expiry checks. |
| US-22 | Roster management | Implemented | Entering locks three approved players. Completing a season or expiring an underfilled one releases the team lock. Historical rosters retain their players and access rules. Roster lock, repeat season and archive privacy tests. |
| US-23 | League standings | Implemented | Club explains how individual duel points determine fixtures and how team fixture results earn standings points. Both totals are labelled separately. Subgroup head-to-head, individual wins and explicit deciders remain covered by standings tests. |
| US-24 | Championship playoffs | Implemented | Server results advance Qualifier 1, Eliminator, Qualifier 2 and Final. New Championship registration is gated on the server. Gate tests and a full 8-team season from validated moves. |
| US-25 | Share cards | Implemented; native QA pending | Result and verified achievement card previews and PNG exports include the sharer’s alias. Same-seed unranked challenge links survive first-run setup. Browser PNG, card privacy and first-run challenge checks. Native sharing requires a device. |
| US-26 | Replay comparison | Implemented | Two boards at a shared move index; side-by-side wide, stacked narrow. Two-client final replay UI; exact shared-engine replay tests. |
| US-27 | Asynchronous duel | Implemented | 24-hour asynchronous private duels, identical sequences and limits. Async expiry and sequence tests. |
| US-28 | Rewarded cosmetics | Partial: simulated provider | Adult-only optional cosmetic offer and idempotent complete/skip/fail lifecycle. Development provider tests only; no live ad SDK or signed reward verification. |
| US-29 | Ranked integrity | Implemented | Server rejects ranked undo, reroll, revive and booster flags; validates coordinates/sequence. Integrity, duplicate action and impossible-move tests. |
| US-30 | Reporting | Implemented for pilot | Rate-limited private reports, durable records and local admin review command. Reporting tests. No staffed moderation operation is supplied. |
| US-31 | Autosave | Implemented | Last confirmed solo state autosaves locally. Storage failures have an inline retry. Reload/resume browser UI test. |
| US-32 | Silent-first feedback | Implemented | Play, tutorial, errors, results and connectivity have visible text. Status and error toasts use live-region semantics and explicit dismissal. Browser gameplay and toast interaction checks. |
| US-33 | Mode selection | Implemented | Solo vs live 30-placement duel vs async 24-hour challenge. Home/room UI and mode rule tests. |
| US-34 | Flexible fixtures | Implemented | Organiser chooses 1–168-hour fixture windows; deadlines enforced server-side. League scheduling and clock-based expiry tests. |
| US-35 | Local face-off | Implemented | Pass-and-play handoff removes the first board and score from the rendered screen and uses an opaque overlay. Player two starts with the same sequence. Browser handoff privacy, identical initial trays and unranked result checks. |
| US-36 | Ad controls | Partial: no live ads | No board ads; test offers have decline/failure states and never block rematches. Provider simulation tests. Real ad scheduling/delivery is absent. |
| US-37 | Remove automatic ads | Blocked on store provider | The restoration control gives a neutral unavailable-billing notice. Browser notice test. Store products, receipt verification and sandbox restoration remain open. |
| US-38 | Account recovery | Pilot implementation | Bearer-key recovery and revision-checked cloud backup; personal vs verified records separated. Restart/recovery/cloud isolation tests. Not email/phone-verified identity. |
| US-39 | Low-effects mode | Device acceptance pending | Low-effects setting disables placement/clear/score effects. Browser execution checked; no representative budget Android hardware benchmark. |
| US-40 | Session awareness | Implemented | Duration tracks foreground time. Optional break reminders are nonblocking, saved to the inbox, and respect quiet mode. Browser timed mute and notification drawer checks. |
| US-41 | Text scaling | Implemented; native QA pending | At 200% text, compact screens give the heading its own line and stack the placement actions. Browser header-height and label-containment checks at 320 px, plus phone-width interaction checks. |
| US-42 | High-contrast theme | Implemented; native QA pending | High-contrast board plus automatic symbols and optional normal-theme patterns. Browser inspection; no accessibility certification claimed. |
| US-43 | Tap-to-place | Implemented | Tap piece, destination, preview, confirm and cancel. Touch drag uses pointer handling on web and keeps the move as a preview until confirmation. Mobile Chromium drag and placement tests. Native gesture verification remains open. |
| US-44 | Relaxed play | Implemented | Untimed solo/practice and async attempts; no default blitz. Mode and async expiry tests. |
| US-45 | Replayable help | Implemented | Replayable tutorial and accessible Help dialog without replacing the saved solo board. Browser keyboard dismissal and board preservation checks. |
| US-46 | Reduced motion | Implemented; native QA pending | System reduced motion respected, user motion/low-effects toggles, optional vibration off by default. Browser settings; OS/native assistive behaviour pending. |
| US-47 | Family leagues | Implemented in the pilot | Invited, guardian-approved family members can join a private league. An outsider cannot see it, and revoking approval blocks active fixture access. Server family-league integration and mobile Club walk-through. Production guardian verification remains open. |
| US-48 | Personal records | Implemented | Local personal/assisted/authoritative competitive bests separated; private history. Cloud record separation tests and profile screen. |
| US-49 | Localisation | Partial localisation | Hindi and Marathi include core menus, tutorial, move counts, line clears, fit cues, board accessibility labels and several match and league statuses. Browser selected-text checks and Devanagari layout inspection. Secondary strings and native-speaker review remain open. |
| US-50 | Simple navigation | Implemented | Primary Solo/Resume one tap after setup; Friends/Club/You secondary. Onboarding and one-tap Play UI test. |

The original full wording and acceptance checks are preserved in `PRODUCT-SPEC-v0.1.md` and `story-coverage.json`. Physical-device acceptance has not been replaced with a simulated pass.

Code map: `shared/engine.ts` (rules), `shared/competition.ts` (standings), `server/service.ts` (authority/persistence), `app/App.tsx` (flows), `app/src/Board.tsx` (interaction/motion), `app/src/design.ts` + `locales.ts` + `ui.tsx` (design/localisation), `storage.ts` (local profiles), `share.ts` + `ShareCard.tsx` + `capture.ts` (result cards).
