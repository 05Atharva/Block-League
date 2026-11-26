# All 50 user stories — implementation and acceptance matrix

This table accounts for every story in Product Spec v0.1. **A mapped story is not automatically a completed acceptance check.** “Implemented” means a working development path exists. Device QA, provider integration and operational requirements are explicitly separate. US-37 is not implemented; US-18, US-20, US-28, US-36 and US-49 remain partial. Guardian and recovery flows are pilot implementations, not verified production identity services.

| Story | Feature / intended outcome | Status | Implementation and evidence |
|---|---|---|---|
| US-01 | Interactive tutorial | Implemented | Tutorial: select, preview, confirm three moves; help is replayable. UI: guided tutorial completes. |
| US-02 | Beginner practice | Implemented | Separate untimed beginner generator; practice is labelled assisted/unranked. Engine simple-pieces and UI practice tests. |
| US-03 | Pattern mode | Implemented; device QA pending | Cell symbols + boundaries in pattern/high-contrast mode. Code and browser inspection; physical vision/colour-blind usability pending. |
| US-04 | Family profiles | Implemented | Profile-scoped saved game, settings, history, stars and records. Storage round-trip and profile-switch UI checks. |
| US-05 | Earned cosmetics | Implemented | A completed round with at least three placements earns stars; Garden at five. Code rules; no payment or ad path required. |
| US-06 | Protected rooms | Pilot implementation | Private rooms only; server blocks child social play until guardian PIN approval. Server guardian tests pass. Guardian identity/consent is not verified. |
| US-07 | Preset reactions | Implemented | Allowlisted reactions only; no free-text chat, DMs or photo upload. Preset/rate-limit server tests. |
| US-08 | Practice hints | Implemented | Free practice hint; no ranked help/undo control. Practice UI and ranked-integrity server tests. |
| US-09 | Round completion | Implemented | Round result and voluntary exit preserve rewards. Tutorial/results UI; no punitive streak/exit mechanics. |
| US-10 | Guardian controls | Pilot implementation | PIN-gated online social/sharing settings and child reminder changes. Guardian server tests. Local profile switching is not a secure parental boundary. |
| US-11 | Room codes | Implemented | Expiring 8-character codes; host removes unstarted guest. Room expiry and host removal tests. |
| US-12 | Deterministic face-off | Implemented | One shared versioned seed/shape/scoring engine and authoritative replay. 500 simulations plus two-client HTTP/UI tests. |
| US-13 | 30-placement duel | Implemented | 30-placement limit and live/async window visible before entry. Limit tests and room UI. |
| US-14 | Reconnection | Implemented | Polling resumes authoritative state within live 60-second grace. Clock-controlled reconnect tests; UI shows reconnection state. |
| US-15 | Post-match replay | Implemented | Move-by-move post-final replay and largest scoring move jump. Replay equality and two-client replay UI checks. |
| US-16 | Teams | Implemented | Private team codes, captain-approved requests, three-player cap. Team membership/roster tests. |
| US-17 | Privacy controls | Implemented | Aliases and authenticated membership checks; private by default. Outsider access and recovery isolation tests. |
| US-18 | Offline practice | Partial | Native offline practice/solo; online attempts require server confirmation. Autosave/hint tests. Offline competitive move submission is not implemented. |
| US-19 | Skill badges | Implemented | Server-verified First/Cross/Five-Clear/Clean Duel/Team/Champion badges; local badges labelled. Engine badge conditions and league champion tests. |
| US-20 | Quiet hours | Partial | Quiet mode mutes foreground reminders without urgency replacements. Settings code. Scheduled push notifications/clock-based quiet-hour windows are not implemented. |
| US-21 | League creation | Implemented | Private 4- or 8-team leagues, invitation, entry deadline and roster limits. League API tests. |
| US-22 | Roster management | Implemented | Three approved members; roster locks on entry. No mid-season substitutions. Post-lock edit rejection tests. |
| US-23 | League standings | Implemented | League points, subgroup head-to-head reapplication, individual wins, explicit deciders. Standings and tied qualification tests. |
| US-24 | Championship playoffs | Implemented | Server results advance Qualifier 1, Eliminator, Qualifier 2 and Final. Full 8-team simulated season from real validated moves. |
| US-25 | Share cards | Implemented; native QA pending | Opt-in PNG card and spoiler-free same-seed practice link; no opponent identity. Browser PNG export test. Native sharing handoff needs phone verification. |
| US-26 | Replay comparison | Implemented | Two boards at a shared move index; side-by-side wide, stacked narrow. Two-client final replay UI; exact shared-engine replay tests. |
| US-27 | Asynchronous duel | Implemented | 24-hour asynchronous private duels, identical sequences and limits. Async expiry and sequence tests. |
| US-28 | Rewarded cosmetics | Partial: simulated provider | Adult-only optional cosmetic offer and idempotent complete/skip/fail lifecycle. Development provider tests only; no live ad SDK or signed reward verification. |
| US-29 | Ranked integrity | Implemented | Server rejects ranked undo, reroll, revive and booster flags; validates coordinates/sequence. Integrity, duplicate action and impossible-move tests. |
| US-30 | Reporting | Implemented for pilot | Rate-limited private reports, durable records and local admin review command. Reporting tests. No staffed moderation operation is supplied. |
| US-31 | Autosave | Implemented | Last confirmed solo state autosaves locally; failed save is visible/retryable. Reload/resume browser UI test. |
| US-32 | Silent-first feedback | Implemented | All play, tutorial, errors, result and connection cues are visual/textual. UI tests run without sound. |
| US-33 | Mode selection | Implemented | Solo vs live 30-placement duel vs async 24-hour challenge. Home/room UI and mode rule tests. |
| US-34 | Flexible fixtures | Implemented | Organiser chooses 1–168-hour fixture windows; deadlines enforced server-side. League scheduling and clock-based expiry tests. |
| US-35 | Local face-off | Implemented | Pass-and-play handoff hides first board, second gets same seed; unranked result. Shared seed engine plus family-duel UI. |
| US-36 | Ad controls | Partial: no live ads | No board ads; test offers have decline/failure states and never block rematches. Provider simulation tests. Real ad scheduling/delivery is absent. |
| US-37 | Remove automatic ads | Not implemented | Purchase-restoration control truthfully reports unavailable billing. No purchase, receipt verification or store restoration is claimed. |
| US-38 | Account recovery | Pilot implementation | Bearer-key recovery and revision-checked cloud backup; personal vs verified records separated. Restart/recovery/cloud isolation tests. Not email/phone-verified identity. |
| US-39 | Low-effects mode | Device acceptance pending | Low-effects setting disables placement/clear/score effects. Browser execution checked; no representative budget Android hardware benchmark. |
| US-40 | Session awareness | Implemented | Session duration and optional foreground break reminders with quiet mode. Code implementation; no reward/league penalty on dismissal. |
| US-41 | Text scaling | Implemented; native QA pending | 100–200% custom text size with scrolling/reflow. Browser 320/360/390/768-width 200% checks; native layout testing pending. |
| US-42 | High-contrast theme | Implemented; native QA pending | High-contrast board plus automatic symbols and optional normal-theme patterns. Browser inspection; no accessibility certification claimed. |
| US-43 | Tap-to-place | Implemented | Tap piece, destination, preview, confirm and cancel; dragging optional. Browser legal placement test; native touch precision pending. |
| US-44 | Relaxed play | Implemented | Untimed solo/practice and async attempts; no default blitz. Mode and async expiry tests. |
| US-45 | Replayable help | Implemented | Plain-language Help modal from board without replacing saved solo; replayable tutorial. Tutorial UI; modal path source inspection. |
| US-46 | Reduced motion | Implemented; native QA pending | System reduced motion respected, user motion/low-effects toggles, optional vibration off by default. Browser settings; OS/native assistive behaviour pending. |
| US-47 | Family leagues | Pilot implementation | Private family team leagues reuse invitations and membership rules. League privacy tests. Guardian production verification remains open. |
| US-48 | Personal records | Implemented | Local personal/assisted/authoritative competitive bests separated; private history. Cloud record separation tests and profile screen. |
| US-49 | Localisation | Partial localisation | Hindi/Marathi core menus and learning, bundled Devanagari; secondary/dynamic messages still English. Browser language/layout checks; native-speaker and full-string QA pending. |
| US-50 | Simple navigation | Implemented | Primary Solo/Resume one tap after setup; Friends/Club/You secondary. Onboarding and one-tap Play UI test. |

The original full wording and acceptance checks are preserved in `PRODUCT-SPEC-v0.1.md` and `story-coverage.json`. Physical-device acceptance has not been replaced with a simulated pass.

Code map: `shared/engine.ts` (rules), `shared/competition.ts` (standings), `server/service.ts` (authority/persistence), `app/App.tsx` (flows), `app/src/Board.tsx` (interaction/motion), `app/src/design.ts` + `locales.ts` + `ui.tsx` (design/localisation), `storage.ts` (local profiles), `share.ts` + `ShareCard.tsx` + `capture.ts` (result cards).
