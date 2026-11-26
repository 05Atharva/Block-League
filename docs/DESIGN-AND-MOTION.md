# Design and motion system

Reference read for this build: https://www.figma.com/resource-library/ui-design-principles/ (5 November 2026).

## Seven principles applied

| Principle | Implementation |
|---|---|
| Hierarchy | One large Solo action; score dominates play; match status and finality are explicit. |
| Progressive disclosure | Home → friends or clubhouse → room/team/season. Settings, account recovery and cosmetics live in You. |
| Consistency | Shared Button, Card, Tag, Input, Row and typography primitives; semantic theme maps. |
| Contrast | Dark framed board, separated empty cells, occupied-cell patterns, high-contrast theme. |
| Accessibility | 100–200% type, optional Atkinson, native accessibility labels, tap/confirm, reduced motion and silent feedback. |
| Proximity | Scores grouped by player; tray adjacent to placement controls; destructive finishing is separate. |
| Alignment | Shared 20px page inset, 24px card radius, regular spacing; reflow instead of clipping large labels. |

## Colour behaviour

Three curated six-colour palettes: Club confetti, Garden party and Aurora. A cosmetic hash selects a colour for each piece index. The shape generator uses a different hash expression, so colour changes do not alter pieces, geometry, legality or scoring. Occupied cells retain their stored colour index. The colour-to-palette mapping changes only when the player selects another palette.

This deliberately interprets “randomly change during the game” as variety in incoming blocks. Arbitrary recolouring of occupied cells during active placement would undermine spatial recognition. There are no flashing colour cycles. Patterns add a second visual cue. Garden unlocks at five earned stars; stars require a completed round with at least three placements, so empty round exits do not earn cosmetics. Aurora is only a development reward-provider demonstration.

## Custom motion choreography

| Trigger | Implementation | Input behaviour | Reduced/low-effects |
|---|---|---|---|
| Piece selection | Persistent border, selected label and tinted tray slot | Immediate, no timer | Same static cues |
| Valid destination | Full-shape ghost with + marks; overlap uses × | Preview only | Same static cues |
| Confirmed placement | Native-driven spring scale .82 → 1.06 → 1; damping 17, stiffness 270, mass .5 | State commits first | Immediate final cells |
| Simultaneous line clear | Per-cleared-cell overlay, opacity to zero, scale 1 → .3 and rotation 0 → 12°, 240ms | Never waits for effect | Immediate clear + text gain |
| Score increment | Small 1 → 1.04 → 1 spring lift in a stable score area | No blocking | Static updated score |
| Press | .98 scale and opacity feedback | Normal button behaviour | Minimal press cue |
| Dialog | Native fade when enabled | Explicit dismiss or confirmation | No transition |

There are no perpetual particle emitters, shake loops, flashing celebrations or sound-only cues. Animation is written in `app/src/Board.tsx` and `app/App.tsx`, not a stock video or Lottie sequence. Native driver is used for transforms/opacity. Native frame pacing is still a physical-device test requirement.

## Typography and layout

Nunito Sans Regular / ExtraBold for English; optional Atkinson Hyperlegible for readability; Noto Sans Devanagari for Hindi/Marathi. Font files are bundled, avoiding a runtime font-network requirement. Body is 16 logical pixels at 100%, with 1.4 line height and dynamic reflow. General controls are at least 52 pixels high; board cells are smaller interactive game targets. A 320-wide screen preserves the board instead of shrinking it to fit all controls without scrolling.

Replays sit side-by-side on sufficiently wide screens and stack on phones. Colours never encode a win, valid move or connection state without accompanying text/symbols.
