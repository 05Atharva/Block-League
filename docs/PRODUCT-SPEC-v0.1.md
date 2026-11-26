# Block League — Product specification v0.1
Prepared for Atharva • 5 November 2026
Status: recommended baseline for review before screen design; not a claim of market uniqueness.

## 1. Product direction

Block League is a silent-first, accessible block puzzle where friends compete under identical game rules and build private seasons together. The primary launch audience is adults aged 18–35 in college and workplace friend groups. The full product should remain usable for ages 7–65, with protected child access, relaxed solo play and accessibility settings. These are product hypotheses; interview and test with real players across all five age groups before treating the stories as validated demand.

One engine, three motivations:
- Relax: untimed solo play with autosave.
- Compete: same-piece face-offs and friend challenges.
- Belong: private teams, fixtures and championship seasons.

Do not add 50 independent features simply because there are 50 stories. Stories express needs; shared features serve multiple cohorts.

## 2. Proposed differentiation and market reality

| Market reality | Proposed position | Concrete implementation | Validation question |
|---|---|---|---|
| Bloxby already offers same-piece friend challenge links, fair daily attempts and share cards. | Private seasons with explainable results. | Fixed-turn contests, post-match replays and visible rule versions. | Do players invite friends for the replay/season experience? |
| Basic block placing and high scores are established mechanics. | A league identity players can build with real friends. | Team crests, roster history, fixtures, standings and championship cards. | Do groups complete a season and start another? |
| Cosmetics and leaderboards are common. | Recognition tied to demonstrable skill and contribution. | Verified combo badges, decisive-move clips and team contribution cards. | Which cards are voluntarily shared and lead to another player? |
| Accessibility is a requirement, not exclusive novelty. | Comfortable cross-generational competition. | Untimed options, patterns, tap-to-place, large text and family rooms. | Can children, busy adults and older players all complete the core loop unaided? |

A feature bundle is easy to copy. Longer-term advantage would come from active friend groups, reliable competitions, recognisable replay cards and excellent play feel. Do not advertise 'first', 'unique' or 'cheat-proof' without evidence.

## 3. Core puzzle and scoring: initial rules to playtest

- Board: 8 × 8; three pieces in each tray.
- Place pieces in any order; no rotation in the initial rules.
- After all three are used, reveal the next tray.
- Completed rows and columns clear simultaneously.
- An intersection counts as one occupied cell but contributes to both completed lines.
- A player locks out when none of the remaining tray pieces can be legally placed.
- Maintain one versioned rules engine shared between client and server.

Suggested score:
- 10 points per placed cell.
- 100 × L² points for clearing L lines in one move.
- Consecutive clearing moves add 25 × min(streak − 1, 9) bonus points.
- A move with no cleared line resets the streak to zero.
- Example: a four-cell piece clearing two lines on the first clearing move earns 40 + 400 = 440.
- Reject impossible placements before they affect score.
- These numbers are a starting balance, not a final optimal scoring model.

Piece sequences: use versioned, deterministic sequences from a seed. Ranked generation must be independent of device, ad revenue and individual board state. Identical pieces do not guarantee an equally easy game after different placement choices; that difference is the intended skill test. Do not promise every endless board is solvable forever.

## 4. Modes and release scope

| Mode | Rules | Initial release |
|---|---|---|
| Learn | Guided practice; no timer; replayable help. | MVP |
| Classic | Untimed endless solo; local autosave; optional assisted practice. | MVP |
| Face-Off | Private 1v1; identical sequence; 30 placements maximum; fixed score rules. | MVP |
| Daily Board | Same daily sequence; one verified attempt per player; practice separate. | V1.1 |
| Friend Challenge | Asynchronous replayable seed with equal rules and clear deadline. | V1.1 |
| Local Family Duel | Pass-and-play; unranked. | V1.1 |
| Mini League | Four teams, three players each, scheduled fixture windows and a final. | V1.1 |
| Championship | Eight teams and seeded top-four playoffs. | Later |
| Blitz | Optional three-minute mode; separate rankings. | Later |

Do not ship public matchmaking before private rooms work reliably. Difficulty modes are not silently applied to ranked matches.

## 5. Face-Off specification

1. Host creates an expiring private room; friend joins through code/link.
2. Both see the rules, placement allowance, privacy setting and 15-minute overall completion window.
3. Both ready up; the server issues the same initial board, sequence and scoring version.
4. Each player has an independent board, identical sequence and at most 30 placements.
5. The room shows opponent progress and score, not their live board or unrevealed pieces.
6. A run ends on lockout, surrender, placement limit or overall expiry.
7. The contest resolves when both are finished or the window expires. A player who finishes first waits or leaves the result to sync later.
8. Highest validated score wins; equal scores are a draw in normal face-offs. Do not use speed as an undeclared tie-breaker.
9. Permit a 60-second reconnect grace within the original window. A sustained disconnect records the validated score at expiry; do not accept unverified moves.
10. Store the official result once. A rematch is free and uses a new sequence.

The 15-minute expiry prevents abandoned rooms from remaining open indefinitely; this is a proposed product setting to test. Unlimited relaxed play belongs in solo or asynchronous modes, not a stalled live room.

### Continuing after the result

The suggested 'both players must watch ads to continue the same game' creates synchronisation problems: one ad may not load, completion durations differ, and declining can pressure a friend. It also weakens trust if a match result changes after a revive.

Recommended behaviour:
- Finalise the official result first.
- Offer a free fresh rematch.
- Optionally offer a casual continuation from saved boards; it cannot change the official result or ranked achievements.
- For eligible adults, a clearly disclosed optional rewarded offer can unlock an individual practice continuation or cosmetic trial.
- Do not make two players' ad delivery a prerequisite for ordinary play. If a future paired continuation is tested, it must be explicitly unranked, independently opt-in, time-bounded and provide a graceful exit if either player declines or an ad fails.
- No ad continuations for children or unknown-age users in the initial product.

## 6. Team seasons and championship

Use original Block League team names, crests and tournament branding. The cricket-league analogy informs the format.

### Mini League, V1.1

- Four private teams; three active players per team.
- One single round-robin: six team fixtures.
- A fixture contains three individual same-sequence duels, paired from locked rosters.
- Individual duel: two fixture points for a win, one for a draw, zero for a loss.
- Higher aggregate fixture points wins the team fixture.
- Team standings: two league points for a fixture win, one for a draw, zero for a loss.
- Standings tie-breaks: league points, head-to-head league points among tied teams, individual duel wins, then a scheduled decider if qualification remains tied. Reapply to a tied subgroup only under the published algorithm.
- Top two teams play a final. If the final fixture ties, captains play a fresh-seed decider; repeat with new seeds until a winner, or use an organiser-rescheduled window if unavailable.
- Clearly show fixture windows, attendance rules and consequences before entry.
- No cash entry, cash prizes, auctions or wagering in the proposed scope.

### Championship, later

- Eight teams; top four qualify after the chosen league schedule.
- Qualifier 1: first versus second; winner goes to the final.
- Eliminator: third versus fourth; loser is out.
- Qualifier 2: Qualifier 1 loser versus Eliminator winner.
- Final: Qualifier 1 winner versus Qualifier 2 winner.
- A second life for the top two makes league seeding meaningful.
- Publish late-arrival, no-show, substitute and abandoned-season rules.
- Do not invent opponent teams or label bots as people.

Individual seasons can reuse the standings and bracket system without team rosters. Delay this variant until team seasons prove useful.

## 7. Progression, levels and achievements

Classic mode should not need thousands of hand-authored levels. Use personal records and optional goals. Learn/Journey can use small validated challenge packs.

Proposed first 30 guided challenges:
- 1–5: placement and legal moves.
- 6–10: row/column clears.
- 11–15: maintaining space.
- 16–20: simultaneous line clears.
- 21–25: consecutive-clear combos.
- 26–30: fixed-move efficiency.

Journey and ranked use visibly different rules. Journey may offer hints, easier pieces and replay; ranked does not.

Achievements:
- First Clear: first completed line.
- Cross Clear: one placement clears a row and column.
- Five-Clear Run: five consecutive clearing placements.
- Clean Duel: complete a verified competitive attempt under standard rules.
- Comeback: win a verified duel after trailing at a defined progress checkpoint.
- Team Contributor: complete assigned fixtures, not arbitrary daily hours.
- League Champion: verified season win.
- Personal Best: clearly distinguish unassisted and assisted solo records.

Avoid fake percentiles and invented rarity. Show relative ranking only with a real eligible population and minimum sample requirement. Reward consistency without punishing missed days.

## 8. Visual direction and accessibility

Theme: friendly modern board-game club. Calm enough for adults, expressive enough for children. Competitive energy lives in results and league screens; the board stays uncluttered.

| Token | Proposed value |
|---|---|
| Main background, Club Light | #F7F8FC |
| Light surface | #FFFFFF |
| Primary text | #172033 |
| Brand/action | #4F46E5 |
| Positive/result accent | #0F766E |
| Trophy accent | #F59E0B; decorative, not small body text |
| Secondary background, Night Club | #101827 |
| Dark surface | #1B263B |
| Dark text | #F8FAFC |
| Card radius | 16 logical pixels |
| Primary touch target | At least 48 × 48 logical pixels |
| Spacing scale | 4, 8, 12, 16, 24, 32 |
| Default body text | 16; support scaling and layout reflow |
| Clear animation | Brief, roughly 150–220 ms; removable with reduced motion |

Fonts:
- Nunito Sans: menus and friendly headings.
- Atkinson Hyperlegible: optional readability preference.
- Noto Sans Devanagari: Hindi/Marathi text when localisation ships.
- Use stable-width score digits where supported; avoid arcade fonts for body text.
- Confirm licensing, character coverage and actual-device rendering when implementing.

Themes:
- Launch: Club Light and High Contrast; Night Club if budget permits.
- Later: Garden, Space, Chalkboard and original cricket-inspired palettes.
- All themes preserve cell boundaries and include optional patterns.
- Themes change appearance only, never board geometry or ranked difficulty.
- Run contrast and text-scaling checks on actual combinations; these colours are proposed tokens, not a completed accessibility certification.

Interaction:
- Drag-and-drop plus tap-piece/tap-destination placement.
- A ghost preview shows legal placement before commitment.
- Solo practice can have undo; ranked cannot.
- No required audio, vibration, microphone, camera, GPS or headphones.
- Show text and visual equivalents for every meaningful cue.
- No celebration blocks the next input; no flashes.
- On small screens, enlarged text must not shrink the board below useful touch sizes.
- No gameplay banners near block trays.

Navigation:
Home offers Play Solo, Face-Off and League. League remains hidden or marked unavailable until shipped. Profile, settings and help are secondary. Initial screen: 'Play' should be clear without reading an event carousel.

## 9. Exactly 50 user stories

Release labels are planning priorities, not promises. In this document 'MVP' means the proposed first playable release; family/social restrictions ship before child social features become accessible.

### Ages 7–12: children and primary-school players

| ID | User story | Feature | Release | Acceptance check |
|---|---|---|---|---|
| US-01 | As a new child player, I want to learn by placing three guided blocks, so that I can start without reading long instructions. | Interactive tutorial | MVP | Tutorial can be replayed and completed without audio. |
| US-02 | As a child learning the game, I want to play an untimed beginner board with simpler pieces, so that I can practise without feeling rushed. | Beginner practice | MVP | Difficulty is visibly labelled and results stay outside ranked tables. |
| US-03 | As a child who recognises shapes more easily than colours, I want to identify blocks using outlines and patterns, so that I can understand the board without relying on colour. | Pattern mode | MVP | All occupied cells remain distinguishable in every theme. |
| US-04 | As a child sharing a family device, I want to use a separate local profile, so that my progress does not overwrite my family's. | Family profiles | Later | Switching profiles restores the correct progress and settings. |
| US-05 | As a child player, I want to earn predictable cosmetic stars by solving puzzles, so that I can see my progress without purchases or ads. | Earned cosmetics | MVP | Rewards never require an ad or provide ranked advantages. |
| US-06 | As a child playing with family, I want to join a guardian-approved private challenge, so that I can play with people my family knows. | Protected rooms | MVP | Child profiles cannot enter public matchmaking or searchable teams. |
| US-07 | As a child player, I want to use preset friendly reactions, so that I can celebrate without exchanging personal details. | Preset reactions | MVP | No free-text chat, photo uploads or direct messages. |
| US-08 | As a child who gets stuck, I want to receive a free practice hint, so that I can learn what a useful move looks like. | Practice hints | MVP | Hints are unavailable in scored competitive attempts. |
| US-09 | As a child player, I want to see a clear stopping point after a round, so that I can leave without losing earned rewards. | Round completion | MVP | No streak-loss or team-loss warning is shown on exit. |
| US-10 | As a guardian of a child aged 7–12, I want to set play reminders and approve sharing or social access, so that I can manage my child's participation. | Guardian controls | MVP | Reminders work locally; external sharing is gated for child profiles. |

### Ages 13–17: secondary-school students

| ID | User story | Feature | Release | Acceptance check |
|---|---|---|---|---|
| US-11 | As a school student, I want to join a private room with a short code, so that I can challenge known friends easily. | Room codes | MVP | Expired codes fail clearly and hosts can remove unstarted seats. |
| US-12 | As a student competing with friends, I want to receive the same piece sequence and scoring rules, so that the result reflects our decisions. | Deterministic face-off | MVP | Server replay produces the recorded score for both players. |
| US-13 | As a student with homework and limited time, I want to choose a short turn-limited challenge, so that I know roughly how much commitment I am making. | 30-placement duel | MVP | Turn allowance and overall expiry are visible before joining. |
| US-14 | As a student on an unstable connection, I want to rejoin a match after a brief drop, so that one network interruption does not immediately end my game. | Reconnection | MVP | Reconnect within the grace period restores confirmed server state. |
| US-15 | As a student who enjoys improvement, I want to review a completed match's decisive moves, so that I can understand how to play better. | Post-match replay | MVP | Opponent moves are revealed only after both attempts are final. |
| US-16 | As a student who enjoys team play, I want to join a private friend team, so that we can compete together. | Teams | V1.1 | Only approved members occupy roster slots. |
| US-17 | As a student who dislikes public pressure, I want to keep my results visible only to invited friends, so that I can compete comfortably. | Privacy controls | MVP | Profiles are private by default; no real-name requirement. |
| US-18 | As a student with limited data, I want to practise offline and submit eligible challenges when connected, so that I can play without a constant connection. | Offline practice | MVP | Offline practice is clearly unranked; ranked submission needs verification. |
| US-19 | As a student who wants recognition, I want to earn skill badges for difficult verified achievements, so that my achievements represent ability. | Skill badges | V1.1 | Badge rules are visible and cannot be satisfied by ad-earned tools. |
| US-20 | As a student taking a break, I want to mute competition reminders temporarily, so that the game fits around my priorities. | Quiet hours | V1.1 | Disabled reminders are not replaced with urgency notifications. |

### Ages 18–24: college students and young adults

| ID | User story | Feature | Release | Acceptance check |
|---|---|---|---|---|
| US-21 | As a college student, I want to create a private league and invite classmates, so that we have an organised competition. | League creation | V1.1 | Invites, roster limits and entry deadline are shown. |
| US-22 | As a team captain, I want to lock a roster before the season starts, so that fixtures stay fair. | Roster management | V1.1 | Post-lock replacements follow an explicit recorded rule. |
| US-23 | As a competitive player, I want to see standings with published tie-breakers, so that I understand how qualification works. | League standings | V1.1 | Equal records resolve by declared rules without hidden changes. |
| US-24 | As a league organiser, I want to run qualifiers, an eliminator and a final, so that the season has meaningful progression. | Championship playoffs | Later | Bracket advancement follows stored results and defined seeding. |
| US-25 | As a player proud of a good match, I want to share a spoiler-free result with a replayable challenge link, so that friends can try the same contest. | Share cards | MVP | No opponent identity is included without that player's permission. |
| US-26 | As a player comparing strategies, I want to view side-by-side replays after a match, so that I can learn from the difference in our decisions. | Replay comparison | V1.1 | Replay works with the original game-rules version. |
| US-27 | As a busy college student, I want to answer a friend challenge asynchronously, so that we do not need to be online together. | Asynchronous duel | V1.1 | Both attempts use the stored sequence and equal rules. |
| US-28 | As an adult who enjoys personalisation, I want to unlock a non-transferable cosmetic preview through an optional ad, so that I can try a style without changing competition. | Rewarded cosmetics | V1.1 | Reward is disclosed, granted once and has no scoring effect. |
| US-29 | As a player who wants fair rankings, I want to enter matches without purchasable boosters or ad advantages, so that winning feels credible. | Ranked integrity | MVP | Undo, reroll and revive requests are rejected in ranked rooms. |
| US-30 | As a league participant, I want to report a suspicious result or inappropriate team name, so that our competition stays trustworthy. | Reporting | V1.1 | Reports are rate-limited, recorded and reviewable. |

### Ages 25–44: office workers, parents and busy adults

| ID | User story | Feature | Release | Acceptance check |
|---|---|---|---|---|
| US-31 | As an office worker, I want to resume my solo board after an interruption, so that short breaks do not erase progress. | Autosave | MVP | Returning restores the last confirmed local move. |
| US-32 | As an adult playing in a noisy place, I want to understand all feedback with sound off, so that headphones are unnecessary. | Silent-first feedback | MVP | Tutorials, errors and results have visual equivalents. |
| US-33 | As a busy adult, I want to choose between relaxed play and a fixed-length duel, so that I can match the game to my available time. | Mode selection | MVP | Time pressure and turn limits are shown before play. |
| US-34 | As an office-team organiser, I want to set fixture windows rather than exact start times, so that colleagues can participate around work. | Flexible fixtures | V1.1 | Attempts expire at a visible server deadline. |
| US-35 | As a parent playing with a child, I want to use pass-and-play on one phone, so that we can enjoy a family challenge together. | Local face-off | V1.1 | Turns are separated and local scores are marked unranked. |
| US-36 | As an adult who dislikes intrusive ads, I want to see ads only at clear breaks and decline rewarded offers, so that I remain in control. | Ad controls | MVP | No ad overlays the board; declining keeps free play available. |
| US-37 | As an adult who prefers uninterrupted play, I want to purchase removal of automatic ads, so that I can choose a quieter experience. | Remove automatic ads | Later | Purchase restoration works; optional rewarded ads remain separately labelled. |
| US-38 | As a player using a second device, I want to recover my account and earned progress, so that a phone change does not erase my history. | Account recovery | V1.1 | Verified sign-in restores cloud records without merging another profile. |
| US-39 | As a player on a budget phone, I want to disable particles and use simple animations, so that the game remains responsive. | Low-effects mode | MVP | Core play is tested on representative budget Android hardware. |
| US-40 | As an adult monitoring screen time, I want to see my session duration and optional break reminder, so that I can make an informed choice about continuing. | Session awareness | MVP | Reminder dismissal never removes rewards or penalises a team. |

### Ages 45–65: midlife and older adults with varied preferences

| ID | User story | Feature | Release | Acceptance check |
|---|---|---|---|---|
| US-41 | As a player who prefers larger text, I want to increase interface text size, so that labels and scores are comfortable to read. | Text scaling | MVP | Controls remain usable at supported maximum text size. |
| US-42 | As a player who wants clearer visuals, I want to use a high-contrast board with patterned blocks, so that occupied cells are easy to distinguish. | High-contrast theme | MVP | Board information never depends on hue alone. |
| US-43 | As a player with less precise touch input, I want to tap a piece and then tap its destination, so that dragging is not my only option. | Tap-to-place | MVP | Preview, confirm and cancel all work without dragging. |
| US-44 | As a player who prefers unhurried play, I want to choose untimed solo and asynchronous challenges, so that quick reflexes are not required. | Relaxed play | MVP/V1.1 | Live blitz is optional and never the default mode. |
| US-45 | As a new player, I want to replay a plain-language tutorial, so that I can learn at my own pace. | Replayable help | MVP | Help is accessible from the board without losing solo progress. |
| US-46 | As a player sensitive to visual motion, I want to reduce animation and disable vibration, so that the game feels comfortable. | Reduced motion | MVP | Flashes and celebratory motion are removed in this setting. |
| US-47 | As a grandparent or older relative, I want to join a private family league, so that I can connect with relatives across age groups. | Family leagues | V1.1 | Only invited accounts appear in the league. |
| US-48 | As a player who enjoys personal goals, I want to track my own improvement without a public rank, so that progress feels rewarding at my level. | Personal records | MVP | Personal, assisted and verified competitive records are separated. |
| US-49 | As a player who prefers Hindi or Marathi, I want to read menus and help in my preferred language, so that language does not prevent participation. | Localisation | V1.1 | Translated text and Devanagari fonts fit supported layouts. |
| US-50 | As a player who values simplicity, I want to use a home screen with a few clear choices, so that I can find play, friends and help easily. | Simple navigation | MVP | Primary play is reachable in one tap after setup. |

## 10. Backend and frontend recommendation

Recommended stack:
- React Native + Expo + TypeScript.
- Shared pure TypeScript rules package for piece generation, legal moves, line clears, score and replay.
- Node.js + TypeScript + Colyseus for live rooms, authoritative move validation, readiness, reconnects and match clocks.
- Supabase Postgres for profiles, teams, memberships, seasons, fixtures, results and moderation records.
- Supabase Auth for eligible account flows; guardian-managed child access needs its own designed and reviewed flow.
- Local persistence for solo state and accessibility settings.
- Server-side jobs for fixture expiry, standings recalculation and season transitions.
- An always-on process/container with WebSocket support for live rooms; do not depend on a host that sleeps or short-lived request functions for active matches.
- Start with one region and a single game-server process for the pilot. Multi-process presence/routing and Redis are scaling options after measured need, not launch requirements.

Why Colyseus: its official documentation supports authoritative state, rooms, matchmaking and reconnect flows. Supabase handles durable relational data and authentication; it does not replace the authoritative game loop.

Authority boundary:
1. Client submits piece identifier, coordinates, move sequence and action identifier.
2. Server checks identity, membership, match state, next legal piece, coordinates and rule version.
3. Server computes the score, logs the move and updates confirmed state.
4. Client may show an optimistic preview; it reconciles against confirmed state.
5. Only a trusted server can finalise scores, standings or achievements.
6. Use idempotent writes so reconnects and repeated result submissions cannot award two wins.
7. Never expose Supabase service-role credentials in the app. Client-visible tables require suitable access policies.
8. Public seeds and deterministic clients do not prevent solver bots or a second-device preview. Replay checks, rate limits and private-first scope reduce risk; do not claim cheating is eliminated.

Suggested persistent entities:
profiles, guardian_links, privacy_settings, teams, team_memberships, seasons, season_entries, fixtures, matches, match_players, match_moves, results, achievements, earned_cosmetics, reward_events, reports.
Avoid high-frequency database writes for animation frames. Persist authoritative moves/checkpoints and final results, with enough recovery data for room restarts.

Replays:
- Store rule version, seed/sequence version, initial board and accepted move list.
- Delay opponent replay visibility until both attempts are complete.
- Share cards can reveal scores without revealing solutions.
- Server-generated result identifiers make claims verifiable without exposing private profiles.

Expo testing:
- Expo Go can prototype core gameplay and compatible networking libraries.
- Native ad SDK integration requires an Expo development build; the React Native Google Mobile Ads package explicitly does not run in Expo Go.
- Check generated Expo/RN versions and compatible package versions at implementation time rather than assuming all current latest versions work together.
- Use test ad units during development.

## 11. Ads, revenue and age-aware access

The business goal is sustainable revenue from players who keep enjoying the game. More ad impressions are useful only when they do not damage return visits, fair competition or voluntary invitations.

Recommended initial product policy:
- Ages under 18 and users of unknown age: ad-free initially, protected social defaults.
- Eligible adults: optional rewarded placements; limited automatic ads between completed solo rounds.
- This under-18 ad-free rule is our proposed simplification, not a claim that Google defines every under-18 user as a child.
- A neutral age screen, regional requirements, consent and guardian flows must be designed before release. An age selection alone does not settle all legal obligations.
- Do not collect exact birth dates merely for analytics; collect only what the approved age/consent flow actually needs.
- No behavioural ad targeting for child profiles; no personalised commercial pressure.

Google Play's Families rules for children/unknown-age users require appropriate self-certified SDK versions, child-appropriate ads, no interest-based advertising/remarketing and format restrictions. Interfering rewarded/opt-in ads must be closeable after five seconds. This is a key reason for the initial ad-free protected experience.

Proposed adult placement experiments:
| Placement | Reward/behaviour | Restrictions |
|---|---|---|
| Solo lockout | One optional assisted continuation per run. | Original unassisted record closes first; continued score marked assisted. |
| Practice | One clearly described hint. | No ranked benefit; free learning help remains available. |
| Cosmetic preview | Temporary personal board/theme preview. | Non-transferable, no random prize or score multiplier. |
| Completed solo round | An occasional interstitial at a natural transition. | Pilot ceiling: one automatic ad per three completed rounds AND at least five minutes since last full-screen ad; skip immediately after a rewarded placement. |
| League fixture | No in-match ads or qualification ad requirement. | Basic match entry, standings and result cards remain free. |

Frequency values are experimental ceilings, not targets. Turn down or remove placements if retention or player trust worsens. Do not compensate for low ad fill by repeatedly blocking play.

Reward lifecycle:
eligible -> offered -> explicit opt-in -> SDK completion/server verification where supported -> idempotent grant -> usable reward.
Handle skipped, unavailable and failed ads explicitly. Never promise a reward then silently lose it. A client 'ad finished' message alone is not authoritative proof for valuable rewards.

Normal play and fresh rematches remain available when an ad is declined. Avoid 'your team will lose unless you watch' messaging, ranking boosts, paid/ad-earned competitive retries, or fabricated losses to generate an ad opportunity.

Optional later revenue:
- Remove automatic ads purchase.
- Cosmetic bundles with no gameplay advantage.
- Do not give purchasers exclusive access to core fair competition in the initial design.

No reliable revenue forecast can be made from competitor ranks. Estimate with actual eligible daily active users, impressions per user, fill rate and realised eCPM, then subtract hosting, acquisition and operating costs. Do not assume every player is an ad-eligible impression.

## 12. Engagement and acquisition features

- One-tap rematch with a fresh seed.
- Private seasons with visible start/end dates and fixture windows.
- Rivalry history with mutual privacy controls.
- Verified milestone cards and short decisive-move replays.
- Team contribution cards that recognise completing fixtures.
- Asynchronous challenges for friends in different schedules.
- Journey packs teaching real skills, not fake IQ claims.
- Optional reminders with quiet hours and easy opt-out.
- No forced social sharing or contact-book upload.
- No streak punishment, hidden difficulty based on advertising value or fake human opponents.

## 13. Release sequence and tests

Prototype:
- Rules engine, board controls, tutorial, autosave and scoring.
- Test comfort and understanding with real players from each age cohort.
- Prove low-end Android input and animation performance.

MVP:
- Classic, private 1v1, server validation, replay, privacy/accessibility settings, neutral age routing and guardian-managed access where needed.
- Protected profiles and reporting route before enabling child social access.
- Adult ads only after test builds prove the core game.
- Test legal moves, simultaneous clears, streak scoring, deterministic sequences, duplicate actions, reconnection, expiry and result finalisation.

V1.1:
- Daily board, async challenges, share cards, four-team mini leagues, cloud recovery and localisation.
- Test roster locks, no-shows, tie-breaks and bracket/standings transitions.

Later:
- Eight-team championship, richer replay comparison, optional blitz, additional cosmetic themes and purchases.
- Add public matchmaking only with enough concurrent users and operational capacity.

Metrics:
- Tutorial completion and first-round completion.
- Day-1/day-7 return rate by cohort and mode; no invented targets.
- Rematch rate and invitation-to-play conversion.
- League fixture and season completion.
- Voluntary share rate and challenge-link completion.
- Disconnect recovery and match result disputes.
- Adult ad opt-in/completion, ad fill, revenue per eligible active user, and retention after ad exposure.
- Privacy-minimised cohort measurement; do not build behavioural ad profiles of children.

Release gates:
- Both devices replay the same accepted move log to the same final score.
- No client can submit an arbitrary winning score or duplicate fixture win.
- No ranked score changes after an ad continuation.
- Core play works with audio off.
- Large text, high contrast and tap-to-place work on supported screen sizes.
- Interrupted solo games restore correctly.
- Underage/unknown-age routes never request ads under the initial policy.
- Clear free route exists after every declined or failed rewarded offer.

## 14. Research sources

Checked 5 November 2026. Store listings are developer descriptions, not independent performance or fairness audits. Proposed product choices above are our recommendations, not claims that competitors lack them.

- Bloxby: https://play.google.com/store/apps/details?id=com.robtasker.dailyblock
- Gridlock: https://play.google.com/store/apps/details?hl=en-US&id=com.aeternaapps.gridlock
- Expo FAQ: https://docs.expo.dev/faq/
- Expo third-party libraries: https://docs.expo.dev/workflow/using-libraries/
- React Native Google Mobile Ads: https://github.com/invertase/react-native-google-mobile-ads
- Colyseus documentation: https://docs.colyseus.io/
- Colyseus reconnection: https://docs.colyseus.io/room/reconnection
- Supabase with Expo: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Google Play Families: https://support.google.com/googleplay/android-developer/answer/9893335
- AdMob rewarded policies: https://support.google.com/admob/answer/7313578
- Nunito Sans source: https://github.com/google/fonts/tree/main/ofl/nunitosans

