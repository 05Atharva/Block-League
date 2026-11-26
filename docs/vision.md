# Block League — Product Vision

**Owner:** Atharva Kanawade  
**Document:** `vision.md` · Version 1.0 · 26 November 2026  
**Status:** Research-informed vision baseline for product, design and engineering review. This document does not certify launch readiness or establish product–market fit.  
**Product:** A mobile block-puzzle game, built around relaxed solo play, fair friend competition and private team seasons.

## 1. The vision

**Make Block League the friendly puzzle club people return to for a satisfying personal challenge, a fair contest with friends and a shared season worth remembering.**

A player should be able to open the game, understand the next action immediately, enjoy placing colourful blocks without needing sound, and leave with their progress intact. When they compete, their decisions should determine the recorded result under published rules. When they share an achievement, it should represent something real and invite another person into a welcoming experience.

The business should earn sustainable revenue from a game people choose to revisit. We will optimise for enjoyable return visits, completed friend contests and healthy group participation. Session length and ad impressions are diagnostic measures, not the purpose of the product.

**Positioning:** For people who enjoy simple puzzles and friendly rivalry, Block League combines an approachable block puzzle with private, same-piece competitions and organised team seasons. Its intended identity is a modern board-game club: welcoming, readable, playful and trustworthy.

## 2. What this document establishes

This vision reconciles the existing product specification, all 50 user stories, the documented v0.3 development build and current primary-source research. It provides direction and decision boundaries; the detailed specification and versioned rules engine remain necessary implementation references.

Four evidence labels apply throughout:

| Label | Meaning |
|---|---|
| **Observed fact** | Supported by a cited primary source or inspected project record. A store description establishes what its publisher advertises, not an independent gameplay audit. |
| **Product commitment** | A deliberate direction for Block League, such as keeping competitive outcomes independent of ads. It is not an external research finding. |
| **Hypothesis** | A proposition about player demand, retention, sharing or commercial performance that still needs testing. |
| **Baseline to test** | A concrete initial parameter, such as a placement limit, that can change through a documented rules version. |

External sources were checked on **26 November 2026**. Internal test results below are historical records from the build, not tests rerun for this document. No player interviews, revenue experiments or independent competitor playtests were conducted for this research.

## 3. The player problem and opportunity

The underlying puzzle category is established. Placing blocks, clearing lines, earning high scores, daily challenges and cosmetic rewards are not new mechanics. Block League therefore needs a reason to become part of a friend group's routine beyond another attractive board.

Our central **problem hypothesis** is that some casual puzzle players want meaningful competition with people they know, but need it to fit around different schedules and abilities. A visible result, an understandable explanation of that result, and a shared season could make the experience more memorable than an isolated personal score.

We are designing for three connected needs:

| Motivation | Player need | Product response | Evidence needed |
|---|---|---|---|
| **Relax** | Enjoy an understandable puzzle during a break. | Untimed solo, offline practice, autosave and clear stopping points. | Players complete the first loop and voluntarily return. |
| **Compete** | Compare decisions under rules that feel fair. | Identical piece sequences, published limits, validated scores and post-match replay. | Friends understand outcomes, finish contests and request rematches. |
| **Belong** | Share an activity without needing everyone online together. | Private teams, flexible fixtures, standings and season recognition. | Groups finish seasons and organise another without repeated prompting. |

The opportunity is plausible, but neither market size nor demand for our particular combination has been measured. Competitor downloads do not establish achievable revenue, acquisition cost or a current Play Store ranking for Block League.

## 4. Market evidence and differentiation

### 4.1 What the reviewed competitors already advertise

| Product | Observed publisher claims | Implication for Block League |
|---|---|---|
| **Block Blast! — HungryStudio** | Its Google Play listing describes an 8×8 board, row/column clears, combos, personal scores and offline play; it lists ads and in-app purchases. [S1] | The basic puzzle, colour and offline convenience are familiar category features. Execution must be excellent, but these alone are not a distinctive position. |
| **Blockudoku — Easybrain** | Its listing describes a 9×9 board, line/square clears, daily challenges, seasonal events and tournaments. [S2] | Events and competitive progression are already present in the category. Our 8×8 rule set must remain clear and should not accidentally inherit Sudoku subgrid rules. |
| **Bloxby — Rob Tasker** | Its listing describes the same daily board and pieces, spoiler-free cards, and friend links that reproduce a piece sequence with a score to beat. [S3] | Identical-piece challenges and share cards cannot honestly be marketed as our invention. |
| **Gridlock — Aeterna** | Its listing describes a shared daily sequence, one attempt and a global leaderboard on a 9×9 board with 3×3 clears. [S4] | Same-sequence daily competition is also established. A Daily Board would support engagement, not prove novelty. |

This is a focused feature comparison, not an exhaustive market census, a top-ten chart or proof that competitors lack private leagues. No current country-specific ranking is claimed.

### 4.2 Our proposed distinction

**The differentiation hypothesis is the quality of the private club experience:** fair friend contests that are easy to join, understandable to review and simple to organise into a season.

| Proposed difference | What the player experiences | How we will validate it |
|---|---|---|
| Private competition as the central experience | Challenge known friends without searching a public lobby. | Observe invitation-to-first-match conversion and reasons people fail to join. |
| Results that can be explained | Replay both final attempts and compare the choices that changed the score. | Ask players to explain why they won or lost; measure whether replay helps them. |
| Seasons that fit ordinary schedules | Captains set fixture windows; teams see a clear route to a final. | Run complete seasons and measure attendance, organiser effort and repeat-season intent. |
| Recognition grounded in actual play | Verified skill and team-contribution cards, with privacy controls. | Measure voluntary sharing and recipients who complete a challenge. |
| Comfortable play across abilities | Silent feedback, patterns, tap placement, readable text and reduced motion. | Observe users with varied vision, dexterity, experience and devices completing the same core tasks. |

Accessibility is a quality commitment, not exclusive novelty. The combination is easy to copy. A defensible advantage would need to develop through active friend groups, reliable operations, recognisable presentation and consistently enjoyable play.

## 5. Audience and adoption strategy

**Initial acquisition focus:** adults aged 18–35 in college and workplace friend groups. This is a focus for recruitment and learning, not evidence that other age groups will not enjoy the game.

**Long-term design audience:** ages 7–65, with capability-based settings and protected participation for younger players. We will use one coherent visual identity rather than separate child and adult skins. Age is not a substitute for testing actual needs.

| Cohort | Needs to support | Experience emphasis |
|---|---|---|
| 7–12, with guardian involvement | Learn through action, receive free help, keep family progress separate and avoid unsafe social exposure. | Guided practice, predictable earned cosmetics, local family play and protected online access when ready. |
| 13–17 | Friendly rivalry, privacy, low-data practice and control over reminders. | Private codes, fair rules, badges and quiet settings; no ads under our initial product policy. |
| 18–24 | Easy invitations, skill recognition and group competition. | Face-Off, asynchronous challenges, share cards and private leagues. |
| 25–44 | Short breaks, reliable resume and flexible participation. | Autosave, clear mode commitments, fixture windows and account recovery. |
| 45–65 | Readability, comfortable controls, unhurried learning and connection with family. | Large text, contrast, tap-to-place, replayable help and optional family leagues. |

**Recommended first pilot:** invited adults, initially recruited from reachable college and office groups. India is a practical initial research market given our context and Hindi/Marathi plans; this is an operating assumption, not a proven demand advantage.

Child-inclusive public availability requires its own privacy, guardian, moderation and store-readiness gates. Running an adult pilot does not permit inaccurate store targeting when the actual product targets children. Google Play explicitly connects child-inclusive target audiences to Families requirements. [S5]

The game should work without headphones, camera, microphone, GPS or a special physical environment. Advertise use during suitable breaks; do not encourage distracted walking, driving or playing during lessons.

## 6. Experience principles

1. **Play is understandable.** Teach by doing, keep the board prominent and show the next useful action.
2. **Competition is credible.** Publish rules before entry; validate moves; never sell a better official result.
3. **Time belongs to the player.** Save solo progress, make deadlines visible and provide natural stopping points.
4. **Recognition is earned.** Explain badges and record types; never invent rankings, rarity or IQ improvements.
5. **Social participation is voluntary.** Use private invitations, optional sharing and friendly preset reactions.
6. **Accessibility is part of core play.** Colour, sound and dragging must not be the sole ways to understand or operate the game.
7. **Monetisation preserves trust.** Declining an ad leaves ordinary play available. Ad delivery never determines a competitive winner.
8. **Promises match evidence.** A prototype, exported bundle or passing simulation is not equivalent to a production service or a completed device acceptance test.

## 7. Core game and mode boundaries

### 7.1 Shared puzzle baseline

The initial rule set uses an **8×8 board**, a **three-piece tray**, placement in any order and **no rotation**. The next tray appears after all three pieces are used. Full rows and columns clear simultaneously. A crossing cell clears once, while both completed lines count. A run locks out when no remaining tray piece fits.

The current scoring baseline is:

```text
move score = 10 × placed cells
           + 100 × (lines cleared)²
           + consecutive-clear bonus

consecutive-clear bonus = 25 × min(streak − 1, 9), only on a clearing move
a move with no clear resets streak to 0
```

A four-cell placement clearing two lines on the first clearing move earns 440 points. These values are an initial balance model, not demonstrated optimal difficulty.

Competitive generation uses a deterministic, versioned sequence. It must not vary by device, advertising value or a player's board state. Equal sequences provide equal starting opportunities; players' choices still produce different boards. Endless play is not promised to remain solvable forever.

### 7.2 Mode portfolio

| Mode | Intended role | Important boundary |
|---|---|---|
| Learn / beginner practice | Teach placement, clears and planning. | Free help; assisted/unranked results. |
| Classic | Relaxed repeat play and personal improvement. | Untimed, autosaved, playable offline; keep assisted records separate. |
| Face-Off | Short private friend competition. | Server-validated, equal sequence and fixed published limits. |
| Asynchronous challenge | Compete around different schedules. | Online authoritative attempt within a visible deadline; not unrestricted offline ranked submission. |
| Local Family Duel | Share one device. | Pass-and-play, private handoff and explicitly unranked. |
| Mini League | Prove the shared-season experience. | Four teams; roster and attendance rules published before entry. |
| Championship | Extend a successful league format. | Eight teams with seeded playoffs; only expose when operationally ready. |
| Daily Board | Optional later shared challenge. | One verified attempt; practice separate; no punitive streak loss. |
| Journey | Optional authored learning content. | Proposed 30 challenges need design and solution validation; not already a finished campaign. |
| Blitz | Optional later speed variant. | Separate rules and rankings; never the default. |

Code already present for a mode does not determine when it should launch. Public scope follows player need and readiness gates.

### 7.3 Face-Off baseline

- Invite through a private, expiring code or link. Both players see the rules and ready up.
- Each gets an independent board, the same initial state and sequence, and at most **30 placements**.
- A live contest has a **15-minute overall completion window**. This is an expiry ceiling, not a promised session duration.
- A run ends through lockout, surrender, the placement cap or expiry. The result resolves when both attempts are final or the contest expires.
- Highest validated score wins; an equal score is a draw. Speed is not a hidden tie-breaker.
- Support **60 seconds of live reconnection grace within the original deadline**. The server's accepted state is authoritative; unverified offline moves do not become official scores.
- Show progress and score without exposing the opponent's live board or future pieces. Reveal replays only after both attempts are final.
- Preserve the official result. A fresh-seed rematch is free.
- The asynchronous pilot uses a **24-hour window**. Its deadline is distinct from live reconnection and league fixture windows.

If a player continues a finished board for practice, that continuation is a separate assisted/unranked activity. It cannot modify a recorded win, badge or league standing. The original idea that both players must watch ads to continue is replaced by free rematches and independent optional adult offers outside official competition.

### 7.4 Seasons and teams

The initial Mini League has **four private teams with three approved players each**. A single round robin creates **six team fixtures**, each containing three individual duels. The top two teams play a final.

Individual duel points inside a fixture are win 2, draw 1, loss 0. The higher aggregate wins the fixture. League standings award a separate win 2, draw 1, loss 0 per team fixture. Keep these two point systems visibly labelled.

Standings use published league points, head-to-head among tied teams, then individual duel wins, with defined reapplication to unresolved subgroups. Qualification still tied requires fresh-seed deciders. The pilot elaborates this into captain mini round robins for tied qualifying groups, repeated for unresolved groups if needed. A tied knockout fixture uses a fresh-seed captain duel, repeated or rescheduled under published rules.

The pilot supports organiser-selected **1–168-hour fixture windows** and locked three-player rosters without mid-season substitutes. Before release, expose the exact no-show, abandonment, rescheduling and organiser permissions in plain language; do not leave them to ad hoc decisions after results are known.

An eight-team Championship can use a single round robin (**28 fixtures**) followed by:

1. Qualifier 1: first versus second; winner reaches the final.
2. Eliminator: third versus fourth; loser exits.
3. Qualifier 2: Qualifier 1 loser versus Eliminator winner.
4. Final: Qualifier 1 winner versus Qualifier 2 winner.

Use original names and artwork. The cricket-league analogy describes structure, not an IPL affiliation. No cash entry, wagering, cash prizes or auctions are in scope.

## 8. Progression, sharing and repeat play

The core loop is **place → clear → understand the result → choose another goal**. The social loop adds **invite → compete → review → optionally rematch or join a season**. Every loop includes an exit that preserves earned progress.

Progression should reward skill and participation rather than hours spent. Examples include a first clear, a cross clear, a consecutive-clear run, a verified completed duel, fixture participation and a season championship. Show each achievement's rule. Clearly distinguish personal, assisted and server-verified records.

Share cards should prioritise a legible achievement, mode, score or result, and an optional replayable challenge link. Default to the sharer's own alias and omit opponents' identity unless permitted. Child sharing follows the approved guardian flow. A private Face-Off link carries the expiring invitation code in the URL fragment. Result and achievement cards carry no private room code, account credential, move log or other member's profile.

A recipient should be able to understand the invitation, join through a safe route and start the intended challenge. Native share sheets, deep links, expired links and missing-app fallbacks require actual-device tests. A generated image alone does not establish a working acquisition loop.

Cosmetics are appearance-only. Recognise participation without punishing missed days, requiring daily logins or making a player responsible for a friend's ad choice. Optional reminders must respect quiet settings. Do not require contact-book upload, sharing, ratings or purchases to obtain ordinary play.

## 9. Visual, interaction and motion direction

**Personality:** a friendly modern board-game club. The board is calm and precise; results and league screens provide controlled celebration. Avoid visual clutter, casino styling, fake urgency and childlike decoration across every surface.

Figma's cited principles inform our approach: hierarchy, progressive disclosure, consistency, contrast, proximity, accessibility and alignment. [S8] Our application of them is a product design choice:

- Make Play/Resume the clearest first action. Introduce competition and league detail progressively.
- Keep scores, turn limits, connection state and placement feedback in predictable locations.
- Reuse components and tokens across onboarding, gameplay, results and leagues.
- Keep destructive actions and surrender distinct from ordinary progression.
- Provide useful loading, empty, invalid-placement, offline, expired-room and unavailable-provider states.

### Colour and type

Use curated colour scales for new pieces, with cosmetic randomness independent of shape generation. Keep placed cells stable and readable. Do not continuously recolour the occupied board or use colour to suggest a change in scoring rules.

Support Club Light, Night Club and High Contrast as a coherent family. Patterns, outlines and occupancy must remain understandable without hue. Decorative themes can follow after the base palette is tested.

Use **Bricolage Grotesque ExtraBold** for display headings and **Instrument Sans** for body text and controls, with Regular and SemiBold weights. Players can choose **Atkinson Hyperlegible** for Latin text. Hindi and Marathi use **Noto Sans Devanagari**. Keep score readouts aligned with tabular numerals where the font supports them. Validate glyph coverage, font licences, wrapping and native rendering. [Design and motion](DESIGN-AND-MOTION.md)

### Controls and accessibility

Provide drag-preview plus tap-piece → destination → preview → confirm/cancel. Target at least 48 dp touch areas for ordinary Android controls, consistent with Android guidance; the pilot uses 52 logical-pixel general buttons. [S9] An eight-column board on a small phone cannot give every cell that width. Test board precision separately and add magnification or another placement aid if necessary.

Support text scaling to the tested maximum, with reflow or scrolling rather than unreadable shrinking. Target 200% text acceptance, high contrast, silent feedback and meaningful accessibility labels. Test TalkBack and VoiceOver workflows before claiming screen-reader playability. These are targets, not a certification.

### Motion

Build a small custom motion language: placement settles into the grid, cleared cells briefly contract, score changes move subtly, and results celebrate without covering controls. Motion should communicate state and never delay the next legal input. Initial timings around 150–250 ms are tuning ranges, not performance guarantees.

Respect system reduced-motion settings and provide explicit reduced-motion/low-effects controls. Keep vibration optional. No flashes or mandatory sound. Budget-device input responsiveness and frame pacing need physical measurement before any 60 fps claim.

## 10. Business model and advertising boundaries

**Commercial hypothesis:** a retained adult audience may support optional rewarded cosmetics and carefully limited ads at natural solo breaks. We have no measured evidence yet that this will cover operating or acquisition costs.

Initial product policy:

| Player/context | Monetisation direction |
|---|---|
| Under 18 or unknown age | Ad-free initially. This is our simplification, not Google's universal definition of a child. |
| Eligible adults | Optional, disclosed cosmetic rewards; later experiments with solo-break interstitials. |
| Ranked duel or league fixture | No ad advantages, forced ad entry, paid retries or outcome-changing continuations. |
| Future paid offering | Cosmetic purchases and removal of automatic ads, with clear entitlement and restoration behaviour. |

Start with cosmetic rewards. Any later solo continuation must close the original unassisted record first and clearly label the continued run assisted. Free learning hints and ordinary rematches remain available.

AdMob requires clear reward disclosure, affirmative opt-in for ordinary rewarded ads, an available skip/dismiss route, and delivery of the promised reward; declining must not obstruct normal use. Rewards must meet its applicable non-monetary and non-transferability requirements. [S7] Block League will offer predictable in-game rewards, not cash, tradeable prizes or random paid chances.

If automatic ads are tested, the proposed ceiling is **one per three completed solo rounds AND at least five minutes since the last full-screen ad**, with no automatic ad immediately following a rewarded one. This ceiling is an experiment setting, not a target or proof of policy compliance. No ads adjacent to the tray, during placement, on live match reconnect, or required to see a result.

The reward flow must handle eligible → offer → opt-in → provider outcome → verified, idempotent grant. Failures and no-fill must return cleanly to play. A client completion flag alone is not sufficient production proof. Use test ad units in development.

For a later remove-automatic-ads purchase, specify what remains available, validate entitlements and test restoration, refunds and revocation. Plan store billing for digital goods and review the applicable regional exceptions under Google and Apple policies before release. [S14][S15] Do not sell an undefined ad-removal benefit before automatic ads actually exist.

### Revenue measurement

Estimate ad revenue from actual delivered impressions:

```text
daily ad revenue ≈ sum over placements and regions(
  measured paid impressions × realised eCPM / 1,000
)
```

For planning before delivery data, model eligible adult active users, offers, opt-in, fill and show rates explicitly. Do not apply eCPM to all installs or count declined offers as impressions. Evaluate contribution after hosting, moderation/support, tools and acquisition; measure purchases net of applicable fees, refunds and taxes separately. No revenue forecast is justified by the current evidence.

## 11. Privacy, age-aware access and trust

Private rooms reduce exposure but do not replace safety or moderation. Team names and aliases still require reporting and review. Use preset reactions rather than free-text chat, public DMs or photo uploads in the initial product.

Google Play requires accurate target-audience declarations. Its Families policies impose specific ad and data restrictions for children and unknown-age users, including conditions on advertising SDKs and identifiers. [S5][S6][S16] The planned ad-free protected route reduces complexity but does not remove all child privacy or store obligations.

Before child-inclusive public release:

- Define the jurisdictions and approved age/guardian flow; obtain appropriate specialist review of the actual design and data processing.
- Ensure unknown-age/protected sessions do not initialise an ad request or transmit restricted identifiers through a third-party SDK.
- Make social approval and external sharing enforceable server-side where applicable.
- Provide a real reporting/review process, action records and appropriate block/remove controls.
- Define account export/deletion, data retention, recovery and guardian revocation behaviour.
- Review all SDK data flows and store disclosures against observed behaviour.

A self-selected age and a local PIN are prototype controls, not verified guardian identity or legal consent. Do not collect precise dates of birth, locations, contacts or real names unless the approved flow actually requires them. Use privacy-minimised measurement and do not build behavioural advertising profiles of children.

Server verification makes results reviewable, not cheat-proof. A determined user may use solvers, extra accounts or a second device. Preserve replay evidence, rate limits and proportionate enforcement; avoid public accusations based only on an unusually good score.

## 12. Technical direction and the existing build

### Intended architecture

Keep **React Native + Expo + TypeScript** for the mobile application and a shared pure TypeScript rules/replay package. Local persistence supports solo play. A trusted Node.js service owns competitive move validation, deadlines, results and standings.

**Recommended production candidate:** Colyseus for authoritative rooms, with Supabase Postgres for durable relational records and suitable authentication flows. Colyseus documents server authority and state synchronisation; Supabase documents database-level row access controls. [S12][S13] These capabilities support the design but do not automatically implement our fairness, guardian or account rules.

The non-negotiable requirement is server authority, not a specific transport vendor. Keep the existing HTTP approach for controlled testing if it meets measured needs; adopt Colyseus through an explicit architecture decision rather than assuming a rewrite is necessary.

Production needs transactional finalisation, restart recovery, scheduled deadline processing, private access policies, backups, secure credentials, monitoring and a tested deployment. Never put privileged server credentials in the mobile app. Match-making, auth, database and reward services need separate responsibility boundaries.

The client submits an action, piece and coordinates; the server validates identity, membership, rules, legal placement and action ordering, computes the result and acknowledges it. Duplicate actions cannot award duplicate points or wins. Replays retain the rule/sequence version, initial state and accepted moves. Rule updates cannot silently rewrite an active season.

Expo Go is useful for compatible prototype functionality. Native integrations require development builds when they are not included in Expo Go; the chosen ads library documents an Expo development-build/config-plugin workflow. [S10][S11] Test actual Android/iOS installs, not only browser exports. Select supported OS/device versions from the chosen dependency set and measured hardware needs before publishing compatibility claims.

### What v0.3 actually establishes

The current development package uses an authoritative Node service with polling and single-process JSON persistence, rather than the proposed Colyseus/Supabase production stack. Its ad provider is explicitly simulated; purchases are unavailable. Accounts use bearer-key recovery, while age is self-declared and guardian controls are prototype-only. [I2]

The coverage record groups the 50 stories as:

| Recorded status | Count | Interpretation |
|---|---:|---|
| Implemented in the development build | 33 | Implementation and the recorded checks exist; this is not blanket production acceptance. |
| Code present; device acceptance pending | 6 | Native sharing, visual/accessibility and performance acceptance remain open. |
| Pilot implementation/limitations | 5 | Protected social access, guardian controls, reporting operations, recovery and family leagues need production work. |
| Partial | 5 | Offline competitive submission, scheduled quiet hours, live rewards/ad delivery and complete localisation remain incomplete. |
| Not implemented | 1 | Paid removal of automatic ads and its purchase/restoration flow. |
| **Total** | **50** | No 50/50 completion claim. |

The historical test report records **30 automated tests**, **12 browser checks**, and **500 simulated games containing 6,536 placements**, with zero invalid states or replay mismatches in that simulation. It records successful type checks and web/Android/iOS bundle exports. [I2]

These results support the checked invariants and browser flows. They do not establish native-device performance, player enjoyment, market demand, live monetisation or legal compliance. Only 4 of the 500 simple-policy simulated games reached 30 placements; the rest locked out. That is a reason to study balance with people, not a measured human completion rate.

The later mobile QA retest recorded **40 of 50 stories passing at pilot scope, 8 partial and 2 blocked**. The current build also lets invite recipients review a private match after first-run setup, supports exports for server-verified badges including Team Contributor and League Champion, labels fixture and standings points separately, and keeps new Championship registration behind a server setting. [QA report](TEST-REPORT.md) · [Current story coverage](50-STORY-COVERAGE.md)

## 13. Release sequence and decision gates

Treat these as readiness stages rather than fixed delivery dates. Several later-stage features exist in prototype code already; they still need their release gates.

| Stage | What we expose or learn | Gate before expansion |
|---|---|---|
| **A. Core and device validation** | Learn, Classic, controls, autosave, visual/motion system. | Real players understand placement and lockout; representative devices handle core input; settings work without losing a board. |
| **B. Private adult competition pilot** | Invitations, Face-Off, async challenges, replay, reporting and sharing. | Two native devices agree on authoritative outcomes; reconnect/expiry/duplicate-action tests pass; operational recovery and private access are reviewed. |
| **C. Mini League pilot** | Four-team seasons and flexible fixture windows. | Full seasons complete, tie/no-show paths are exercised, organiser burden is acceptable and groups choose to return. |
| **D. Adult monetisation pilot** | Real optional rewarded cosmetics, then limited solo-break ads if justified. | Test-unit and provider verification pass; age/consent routing, decline/failure paths and measurement are working. Retention and trust guardrails are set before exposure. |
| **E. Broader family and language release** | Protected younger players, family leagues, complete Hindi/Marathi and stronger recovery. | Guardian/privacy/store review, moderation operations, native accessibility and native-speaker acceptance complete. |
| **F. Expansion** | Championship, Daily Board, Journey, purchases and optional new modes. | Each addition addresses observed demand without weakening the core loop; billing and restore tested before purchases. |

An early public release need not contain every long-term story. Do not market a protected child service, monetised release or fully accessible game before the corresponding gate passes.

### Essential acceptance gates

- Accepted move logs reproduce the same final score on client and server.
- Invalid/duplicate/out-of-order actions cannot corrupt a board or double-finalise a fixture.
- A finished official result cannot change after a continuation or ad event.
- Restart, reconnect, timeout and no-show behaviour match the published rules.
- A declined, failed or unavailable reward offer preserves a free route to play.
- Protected and unknown-age routes make no ad requests under our product policy.
- Sound-off play, tap placement, large text, contrast and reduced motion are usable on supported physical devices.
- Local and recovered progress remain separated by profile; account deletion/revocation works as designed.
- Shared links preserve privacy and handle installation, expiry and permissions correctly.
- Support can receive and act on reports, and administrators cannot silently rewrite outcomes.

## 14. Measurement and learning plan

### Primary success measure

Use **weekly returning players who complete at least one meaningful play activity**: a completed solo round, a validated friend duel or an assigned league attempt. A returning player must have played in an earlier week. Report the three activity types separately so long solo sessions cannot conceal an unhealthy social experience.

The distinguishing social measure is **returning private groups that complete competitions**, not raw room creation. Define a group by its stable team or participant set and record how the definition changes between experiments.

| Metric | Definition / interpretation |
|---|---|
| Tutorial completion | Players finishing the guided sequence divided by players starting it. |
| First meaningful play | New eligible players completing their first round/duel, with abandoned starts reported separately. |
| D1/D7 retention | Share of a new-player cohort returning on day 1/day 7 after first play; freeze timezone and day-window definitions before analysis. |
| Invitation conversion | Eligible invite recipients who start and finish the intended activity; distinguish opened links from people and filter repeated opens. |
| Rematch rate | Finalised duels followed by a mutually started fresh rematch; distinguish an offer from acceptance. |
| Fixture completion | Resolved fixtures with genuine participant attempts divided by scheduled fixtures; report forfeits/no-shows separately. |
| Season continuation | Completed groups that start another season, plus reasons for declining. |
| Voluntary sharing | Players choosing to share and recipients completing the linked challenge; distinguish card generation from confirmed sharing where measurable. |
| Reliability | Crash-free sessions, lost-progress incidents, reconnect success, invalid finalisations and result disputes. |
| Adult monetisation | Eligible offer rate, opt-in, fill/show/completion, reward failure, realised revenue and retention by exposure. |
| Comfort and control | Task success with accessibility settings, unintended placements, declined ads that block play, and reminder opt-out failures. |

No retention, revenue or viral-growth targets are presented as industry benchmarks. Establish baselines first; pre-register success thresholds, sample requirements and stop conditions before each experiment. Report sample sizes and uncertainty rather than inferring causality from a small before/after change.

### Proposed research sequence

1. **Formative usability:** recruit approximately five participants per age cohort (about 25 total), including varied gaming experience and accessibility needs. This is a starting recruitment plan, not statistical validation. Research with minors requires appropriate guardian consent and child assent; use protected builds.
2. **Core tasks:** learn a clear, recover an interruption, identify an illegal placement, use tap placement, explain a result and locate a privacy/quiet setting. Record assistance, errors and reasons for stopping.
3. **Adult group pilot:** recruit four independent groups of 12 players where practical, each able to form a four-team Mini League. Observe two seasons, organiser workload and repeat participation. Report selection bias from friends/classmates.
4. **Differentiation test:** compare interest in a basic score challenge, a replay-supported duel and a season invitation. Examine actual participation and interviews, not only stated preference.
5. **Monetisation test:** after the free experience and provider integration are stable, compare adult cohorts with and without a clearly specified offer. Set the allowed retention/trust tradeoff before viewing results. Do not experiment on minors' ad exposure.
6. **Release review:** consolidate technical failures, qualitative findings, cohort metrics and operating costs into a ship/revise/defer decision. Repeat research when rules or onboarding materially change.

## 15. Main risks and unresolved decisions

| Risk / unknown | Response and evidence required |
|---|---|
| Private leagues may be too much effort for casual players. | Begin with direct duels; observe season completion and simplify team size/organisation only through a revised published format. |
| Identical sequences may feel unfair after an early bad choice. | Teach the distinction between equal opportunity and guaranteed solvability; test replay explanations and seed distributions. |
| Difficulty may cause very short, frustrating runs. | Use human sessions and multiple simulation policies; inspect piece catalogue and survival distribution before tuning. |
| Invitations may not convert or sustain groups. | Measure the entire link-to-completed-match path; retain solo value for people whose friends do not join. |
| Eight-column touch precision may exclude some players. | Device tests, clear previews and a magnified/alternative placement design if needed. |
| Ads may undermine trust or fail to fund operation. | Start with voluntary adult cosmetics, measure costs and retention, reduce/remove ineffective placements. |
| Child-inclusive scope adds work beyond the prototype. | Keep protected public access gated on verified flows, review and support capacity; do not confuse a PIN with consent. |
| Cheating or disputes may weaken league credibility. | Preserve validated logs and transparent rules, with proportionate review and appeal processes. |
| Small-team operations may be overloaded. | Limit pilot size; establish reporting, backup, incident and deadline ownership before growth. |
| Name/artwork may conflict with existing rights. | Treat Block League as a working brand until appropriate name, store and intellectual-property checks are completed. No clearance is claimed. |

Before public release, explicitly decide: initial countries, supported device/OS matrix, account and guardian providers, retention/deletion schedule, moderation ownership, published attendance rules, notification scope and exact exposed modes. These are open decisions, not reasons to change the core vision.

## 16. Scope boundaries and change control

Initial scope excludes public matchmaking, open chat/DMs, user photo uploads, cash competitions, tradeable rewards, pay-to-win tools, AI coaching inside ranked attempts, mandatory sharing and expensive 3D effects. It also excludes claims of cognitive or medical benefits.

Future proposals should answer:

1. Which existing player need or newly researched problem does this solve?
2. Does it strengthen Relax, Compete or Belong?
3. Can it preserve fair outcomes, privacy and an ordinary free path?
4. What will be measured, and what finding would make us remove it?
5. What new accessibility, safety and operating work does it introduce?

Version changes to scoring, piece generation, duel limits and tie-breakers. Record the reason and acceptance evidence. Publish the applicable rules before a match/season begins; avoid silent mid-season changes. This vision can evolve after evidence, but an attractive screen or monetisation opportunity is not sufficient reason to violate its commitments.

## 17. Traceability to the 50 user stories

The following table preserves every original story ID and its current recorded status. It is a concise mapping, not a rewrite of the original acceptance criteria. The full stories remain in [I1]; the implementation notes and checks remain in [I2]. Status **Implemented** means implemented in the development build, with the validation limits described in section 12.

| ID | Need / feature | Vision connection | Recorded v0.3 status |
|---|---|---|---|
| US-01 | Interactive tutorial | Learn safely and play with family | Implemented |
| US-02 | Beginner practice | Learn safely and play with family | Implemented |
| US-03 | Pattern mode | Learn safely and play with family | Implemented; device QA pending |
| US-04 | Family profiles | Learn safely and play with family | Implemented |
| US-05 | Earned cosmetics | Learn safely and play with family | Implemented |
| US-06 | Protected rooms | Learn safely and play with family | Pilot implementation |
| US-07 | Preset reactions | Learn safely and play with family | Implemented |
| US-08 | Practice hints | Learn safely and play with family | Implemented |
| US-09 | Round completion | Learn safely and play with family | Implemented |
| US-10 | Guardian controls | Learn safely and play with family | Pilot implementation |
| US-11 | Room codes | Private, fair and flexible competition | Implemented |
| US-12 | Deterministic face-off | Private, fair and flexible competition | Implemented |
| US-13 | 30-placement duel | Private, fair and flexible competition | Implemented |
| US-14 | Reconnection | Private, fair and flexible competition | Implemented |
| US-15 | Post-match replay | Private, fair and flexible competition | Implemented |
| US-16 | Teams | Private, fair and flexible competition | Implemented |
| US-17 | Privacy controls | Private, fair and flexible competition | Implemented |
| US-18 | Offline practice | Private, fair and flexible competition | Partial |
| US-19 | Skill badges | Private, fair and flexible competition | Implemented |
| US-20 | Quiet hours | Private, fair and flexible competition | Partial |
| US-21 | League creation | Organise, recognise and trust competition | Implemented |
| US-22 | Roster management | Organise, recognise and trust competition | Implemented |
| US-23 | League standings | Organise, recognise and trust competition | Implemented |
| US-24 | Championship playoffs | Organise, recognise and trust competition | Implemented |
| US-25 | Share cards | Organise, recognise and trust competition | Implemented; native QA pending |
| US-26 | Replay comparison | Organise, recognise and trust competition | Implemented |
| US-27 | Asynchronous duel | Organise, recognise and trust competition | Implemented |
| US-28 | Rewarded cosmetics | Organise, recognise and trust competition | Partial: simulated provider |
| US-29 | Ranked integrity | Organise, recognise and trust competition | Implemented |
| US-30 | Reporting | Organise, recognise and trust competition | Implemented for pilot |
| US-31 | Autosave | Fit play around everyday life | Implemented |
| US-32 | Silent-first feedback | Fit play around everyday life | Implemented |
| US-33 | Mode selection | Fit play around everyday life | Implemented |
| US-34 | Flexible fixtures | Fit play around everyday life | Implemented |
| US-35 | Local face-off | Fit play around everyday life | Implemented |
| US-36 | Ad controls | Fit play around everyday life | Partial: no live ads |
| US-37 | Remove automatic ads | Fit play around everyday life | Not implemented |
| US-38 | Account recovery | Fit play around everyday life | Pilot implementation |
| US-39 | Low-effects mode | Fit play around everyday life | Device acceptance pending |
| US-40 | Session awareness | Fit play around everyday life | Implemented |
| US-41 | Text scaling | Readable, comfortable and inclusive play | Implemented; native QA pending |
| US-42 | High-contrast theme | Readable, comfortable and inclusive play | Implemented; native QA pending |
| US-43 | Tap-to-place | Readable, comfortable and inclusive play | Implemented |
| US-44 | Relaxed play | Readable, comfortable and inclusive play | Implemented |
| US-45 | Replayable help | Readable, comfortable and inclusive play | Implemented |
| US-46 | Reduced motion | Readable, comfortable and inclusive play | Implemented; native QA pending |
| US-47 | Family leagues | Readable, comfortable and inclusive play | Pilot implementation |
| US-48 | Personal records | Readable, comfortable and inclusive play | Implemented |
| US-49 | Localisation | Readable, comfortable and inclusive play | Partial localisation |
| US-50 | Simple navigation | Readable, comfortable and inclusive play | Implemented |

## 18. Validation performed for this vision

| Check | Outcome and boundary |
|---|---|
| Product identity and scope | Aligned to Block League, not the separate Arrowbound project. |
| Source of truth | Read the existing product specification and inspected the local build's coverage, test report, production gaps and selected engine rules. |
| Story completeness | All 50 original IDs retained exactly once in the traceability table; status totals reconciled to the coverage JSON. |
| Market claims | Checked primary store listings. Removed novelty assumptions for same-piece challenges, cards and daily competition. No ranking/revenue estimate inferred. |
| Rules consistency | Reconciled 8×8 play, three-piece trays, scoring, 30-placement cap, 15-minute live expiry, 60-second grace and separate async/fixture deadlines. |
| League arithmetic | Four-team single round robin = 6 fixtures; eight-team single round robin = 28. Fixture points and standings points are distinct. |
| Monetisation consistency | Free rematches, immutable official results, ad-free under-18/unknown-age route, optional adult offers and graceful failure are consistent across sections. |
| Technical feasibility | Checked official Expo, ad-library, Colyseus and Supabase documentation. Proposed production stack is explicitly separated from the pilot implementation. |
| Policy accuracy | Checked official Google Play/AdMob and Apple guidance. Product choices are distinguished from policy; no legal certification or store approval claimed. |
| Readiness accuracy | Historical test results retained with limitations. No new device tests or live ad/purchase tests claimed. |
| Demand and commercial validation | Still pending. This document supplies a research plan, not fabricated user validation. |

**Assessment:** The vision is coherent, traceable to the stated needs and technically plausible. The strongest unresolved question is whether real friend groups will repeatedly organise and complete competitions. Validate that behaviour before treating broader feature scope or more advertising as the path to growth.

## 19. Sources and project records

All external sources below were accessed on **26 November 2026**. Live pages can change; recheck policies and SDK requirements before release. Publisher listings are first-party feature descriptions, not independent audits. Sources support the factual statements associated with them; our audience choice, rules, frequency caps, research samples and roadmap are product proposals.

### External primary sources

- **[S1] Google Play — Block Blast!, HungryStudio.** Basic 8×8 mechanics, offline positioning and listed monetisation. <https://play.google.com/store/apps/details?id=com.block.juggle>
- **[S2] Google Play — Blockudoku, Easybrain.** 9×9 board, daily challenges, seasonal events and tournaments. <https://play.google.com/store/apps/details?id=com.easybrain.block.puzzle.games>
- **[S3] Google Play — Bloxby, Rob Tasker.** Same daily pieces, friend challenges and spoiler-free cards. <https://play.google.com/store/apps/details?id=com.robtasker.dailyblock>
- **[S4] Google Play — Gridlock, Aeterna.** Shared daily sequence and 9×9 competition. <https://play.google.com/store/apps/details?id=com.aeternaapps.gridlock>
- **[S5] Google Play — Manage target audience and app content settings.** Accurate targeting and child-inclusive policy scope. <https://support.google.com/googleplay/android-developer/answer/9867159>
- **[S6] Google Play — Families Policies.** Child/unknown-age advertising and monetisation requirements. <https://support.google.com/googleplay/android-developer/answer/9893335>
- **[S7] Google AdMob — Policies for ad units that offer rewards.** Reward eligibility, disclosure, choice and delivery. <https://support.google.com/admob/answer/7313578>
- **[S8] Figma — UI design best practices: 7 principles + how to apply them.** Design principles requested for the project. <https://www.figma.com/resource-library/ui-design-principles/>
- **[S9] Android Developers — Make apps more accessible.** Touch targets and accessible control descriptions. <https://developer.android.com/guide/topics/ui/accessibility/apps>
- **[S10] Expo — Introduction to development builds.** Native-library support and the development-build workflow. <https://docs.expo.dev/develop/development-builds/introduction/>
- **[S11] Invertase — React Native Google Mobile Ads.** Maintainer documentation for native ads and Expo installation. <https://docs.page/invertase/react-native-google-mobile-ads>
- **[S12] Colyseus — Official documentation.** Authoritative Node game servers, rooms and state synchronisation. <https://docs.colyseus.io/>
- **[S13] Supabase — Row Level Security.** Database-enforced access policies. <https://supabase.com/docs/guides/database/postgres/row-level-security>
- **[S14] Google Play — Payments.** Digital goods, ad-free functionality and applicable billing exceptions. <https://support.google.com/googleplay/android-developer/answer/9858738>
- **[S15] Apple — App Review Guidelines.** In-app purchase and user-generated-content review requirements; regional provisions require release-time review. <https://developer.apple.com/app-store/review/guidelines/>
- **[S16] Google Play — Data practices in Families apps.** Restrictions on transmitting specified identifiers from children and unknown-age users. <https://support.google.com/googleplay/android-developer/answer/11043825>

### Internal project evidence

- **[I1] Block-League-Product-Spec-v0.1.md**, 5 November 2026. Original 50 stories, rules, product direction and roadmap. [Open specification](https://chatgpt.com/library?file_id=libfile_75a80ba7c4048191b3d713f4169c41a0&account_id=personal).
- **[I2] Block-League-v0.3-source.zip.** Inspected `docs/story-coverage.json`, `docs/TEST-REPORT.md`, `docs/PRODUCTION-INTEGRATIONS.md` and selected shared/server rules. The test report is dated 5 November 2026. [Open development package](https://chatgpt.com/library?file_id=libfile_5eee4c05738c8191914d49577f7d55e7&account_id=personal).

---

**Decision anchor:** Build a puzzle people enjoy alone, trust against friends and choose to organise into a club. Let demonstrated player value determine expansion and monetisation.
