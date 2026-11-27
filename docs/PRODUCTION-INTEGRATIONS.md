# Remaining production integration work

The package is executable and has real rule enforcement, but it must not be advertised as a launch-ready child/family service or as completing all 50 acceptance checks.

## Live advertising — US-28 and US-36

Implemented: adult eligibility gate, explicit offer, decline, failed/skipped/completed simulation, server-owned idempotent cosmetic grant. Missing: native ad SDK, production consent UI, AdMob configuration, real load/show lifecycle, server reward-signature validation and policy review. No interstitial scheduler or real ads run in this build. A device “finished” event is not sufficient proof for a production reward.

Keep the rules engine unaware of advertising. Adapt the offer/completion boundary behind a genuine provider; do not expose `ALLOW_TEST_REWARDS=1`. Use test ad units in an Expo development build, verify fail/skip paths and enforce the under-18/unknown-age ad-free product policy.

## Paid remove-ads entitlement — US-37

Not implemented. The UI has a truthful unavailable-provider response, not a working purchase. Required work: configure non-consumable products in the stores, integrate the native billing SDK, verify store transactions on the server, persist entitlements, handle refunds/revocations, restore on another device and run both store sandbox flows. The developer of this ZIP has not created store products, a payment flow or a receipt verifier.

## Accounts, guardian controls and secure release

The pilot uses anonymous private identities, recovery keys and self-declared age. Family profile switching and the guardian PIN support local and invited pilot use. Production still needs verified guardian identity before child social features, secure platform credentials, session expiry, lost-key recovery, export and deployment-appropriate access logging. Deleting an account revokes every session and its recovery key.

Move the single-process JSON state to the planned durable database and transactional result writes. Replace polling with Colyseus or another authenticated authoritative transport if profiling justifies it. Keep the shared rules/replay module. Add TLS, explicit browser origins, automated backups, scheduled deadline processing, resource quotas and load tests. The current lazy expiry reconciliation happens on server requests; it does not deliver background notifications.

Qualification ties use head-to-head reapplication, individual duel wins, then a fresh-seed captain mini-round-robin among tied qualifying teams. If that decider round remains cyclic/tied, schedule another round among the unresolved subgroup. This elaborates the original “scheduled decider” rule. An organiser must publish these rules before inviting players.

The Notifications drawer is a foreground inbox. System push would require a registered device channel, consent preferences, delivery credentials, and a backend job for deadlines. The pilot stores quiet preferences and applies them to in-app reminder generation.

## Private invitations and Championship rollout

Hosted web builds copy invitations on the current origin. Set `EXPO_PUBLIC_WEB_URL` in native builds to the hosted web app's HTTPS origin so recipients can review an invite in a browser. Builds without that setting copy a `blockleague:///` link for installed builds and display the manual room code. Test platform sharing and configure Android App Links and iOS Universal Links before offering installed-app handoff from the HTTPS URL.

New Championship registration is disabled by default. Set `ENABLE_CHAMPIONSHIP=1` on the server when the staged rollout reaches Championship. Mini League and existing seasons stay available to eligible participants when the switch is off.

## Android store build and account deletion

The production build profile in `app/eas.json` produces an Android App Bundle. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` to deployed HTTPS origins in the EAS production environment. From `app/`, use `eas build --platform android --profile production` with the project's upload signing configuration. The packaged client uses that API origin and hides pilot commerce. Verify target API, 16 KB compatibility and the signed installation from an applicable Play test track before public rollout. [EAS build configuration](https://docs.expo.dev/build/eas-json/) · [Google Play technical requirements](https://support.google.com/googleplay/android-developer/answer/17492799)

Set `BLOCK_LEAGUE_PRODUCTION=1` on the backend. Run behind an HTTPS proxy and set `DATA_FILE` to an absolute path on a persistent volume. The current file store is for a single writer. Verify backup and restore, rate limiting behind the proxy, and two-device multiplayer against the actual deployment. Production blocks new 7–12 online accounts and protected live social play. The child audience declaration and privacy review still apply to the actual product and distribution choices.

Players can delete their signed-in account from **You → Online account & recovery**. Serve **`/account-deletion` on the API origin** and verify that it works in a fresh browser before adding the URL in Play Console. The external page authenticates with the game's recovery key. The service removes cloud progress, player details, saved recovery credentials, all sessions, reward offers, submitted reports and reactions. Other players retain shared scores and replays labelled “Deleted player”. An offline device may retain a local copy until the player removes the profile there. Publish any retention and backup-deletion schedule that applies to the hosted service. [Google Play account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)

## Localisation and accessibility — US-39, US-41, US-46, US-49

Implemented: scalable layout, 52-pixel general buttons, high contrast, occupied-cell symbols, tap-to-place, custom motion opt-out, system reduced-motion response, Hindi/Marathi core menu and tutorial translations, Devanagari font. Still needed: native-speaker review of all secondary/dynamic messages; full localisation of league/server errors; TalkBack/VoiceOver testing; a magnified placement mode if users need larger-than-cell targets; real Android/iOS drag tests and measurements on representative budget phones.

Do not claim 60fps, WCAG certification, complete screen-reader playability or budget-phone acceptance from a browser export. The app scrolls at large type to preserve readable controls and board size; it does not promise the entire game fits one short viewport at 200% type.

## Scope outside the exact 50 stories

The original spec also suggested daily verified boards, 30 Journey challenges, blitz, comeback badges and later cosmetic themes. Those optional roadmap items are not present. The replayable tutorial is three placements, not a 30-level campaign. Shared cards link to an unranked same-seed challenge, not a public searchable leaderboard.
