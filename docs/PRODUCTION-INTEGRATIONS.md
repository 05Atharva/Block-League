# Remaining production integration work

The package is executable and has real rule enforcement, but it must not be advertised as a launch-ready child/family service or as completing all 50 acceptance checks.

## Live advertising — US-28 and US-36

Implemented: adult eligibility gate, explicit offer, decline, failed/skipped/completed simulation, server-owned idempotent cosmetic grant. Missing: native ad SDK, production consent UI, AdMob configuration, real load/show lifecycle, server reward-signature validation and policy review. No interstitial scheduler or real ads run in this build. A device “finished” event is not sufficient proof for a production reward.

Keep the rules engine unaware of advertising. Adapt the offer/completion boundary behind a genuine provider; do not expose `ALLOW_TEST_REWARDS=1`. Use test ad units in an Expo development build, verify fail/skip paths and enforce the under-18/unknown-age ad-free product policy.

## Paid remove-ads entitlement — US-37

Not implemented. The UI has a truthful unavailable-provider response, not a working purchase. Required work: configure non-consumable products in the stores, integrate the native billing SDK, verify store transactions on the server, persist entitlements, handle refunds/revocations, restore on another device and run both store sandbox flows. The developer of this ZIP has not created store products, a payment flow or a receipt verifier.

## Accounts, guardian controls and secure release

The pilot has anonymous private identities and cryptographic bearer recovery, not verified email or guardian identity. Age is self-declared. Family profile switching is a convenience, not a tamper-resistant parental boundary. Do not treat the guardian PIN as verified legal consent. Native sessions are in AsyncStorage in this build; use platform secure storage for production credentials. Add session revocation/expiry, lost-key recovery, account deletion/export and deployment-appropriate access logging.

Move the single-process JSON state to the planned durable database and transactional result writes. Replace polling with Colyseus or another authenticated authoritative transport if profiling justifies it. Keep the shared rules/replay module. Add TLS, explicit browser origins, automated backups, scheduled deadline processing, resource quotas and load tests. The current lazy expiry reconciliation happens on server requests; it does not deliver background notifications.

Qualification ties use head-to-head reapplication, individual duel wins, then a fresh-seed captain mini-round-robin among tied qualifying teams. If that decider round remains cyclic/tied, schedule another round among the unresolved subgroup. This elaborates the original “scheduled decider” rule. An organiser must publish these rules before inviting players.

The Notifications drawer is a foreground inbox. System push would require a registered device channel, consent preferences, delivery credentials, and a backend job for deadlines. The pilot stores quiet preferences and applies them to in-app reminder generation.

## Private invitations and Championship rollout

Hosted web builds copy invitations on the current origin. Set `EXPO_PUBLIC_WEB_URL` in native builds to the hosted web app's HTTPS origin so recipients can review an invite in a browser. Builds without that setting copy a `blockleague:///` link for installed builds and display the manual room code. Test platform sharing and configure Android App Links and iOS Universal Links before offering installed-app handoff from the HTTPS URL.

New Championship registration is disabled by default. Set `ENABLE_CHAMPIONSHIP=1` on the server when the staged rollout reaches Championship. Mini League and existing seasons stay available to eligible participants when the switch is off.

## Localisation and accessibility — US-39, US-41, US-46, US-49

Implemented: scalable layout, 52-pixel general buttons, high contrast, occupied-cell symbols, tap-to-place, custom motion opt-out, system reduced-motion response, Hindi/Marathi core menu and tutorial translations, Devanagari font. Still needed: native-speaker review of all secondary/dynamic messages; full localisation of league/server errors; TalkBack/VoiceOver testing; a magnified placement mode if users need larger-than-cell targets; real Android/iOS drag tests and measurements on representative budget phones.

Do not claim 60fps, WCAG certification, complete screen-reader playability or budget-phone acceptance from a browser export. The app scrolls at large type to preserve readable controls and board size; it does not promise the entire game fits one short viewport at 200% type.

## Scope outside the exact 50 stories

The original spec also suggested daily verified boards, 30 Journey challenges, blitz, comeback badges and later cosmetic themes. Those optional roadmap items are not present. The replayable tutorial is three placements, not a 30-level campaign. Shared cards link to an unranked same-seed challenge, not a public searchable leaderboard.
