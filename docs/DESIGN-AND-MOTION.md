# Block League design and motion

The logo pairs a coral corner piece with a slightly rotated citron tile. The corner is stable. The open space and offset tile suggest the next decision. Use the source mark in [app/assets](../app/assets/block-league-mark.svg) for exports, with the in-app mark, platform icons, favicon, and share cards following the same silhouette. The finished tile motif appears on round results.

## Player flows

| Player need | Screen and design decision |
|---|---|
| New or younger player learning by doing (US-01–03, US-08) | Play gives Solo the primary action. Learn and Beginner practice are available from the same screen. The board uses a full-shape preview before confirmation. |
| Someone playing in a short break (US-31–33, US-44, US-50) | Resume replaces the fresh Solo action when a save exists. Progress is visible locally. Private Face-Off and Club have short labels that explain what opens next. |
| Friends or competitive players (US-11–17, US-21–29) | Preserve room state, deadlines, and official versus pending results. Reveal opponent moves after both attempts are final. Use specific verified achievements tied to actual play. |
| Families and mixed experience levels (US-04–10, US-35, US-47) | Preserve profile isolation, pass-and-play handoff, and guardian gates. Give each round a clear stopping point. |
| Players who need more comfortable controls (US-39–46, US-49) | Maintain high contrast, pattern mode, 100–200% text, Atkinson and Noto Devanagari, tap-to-place, silent feedback, and optional motion. |

The screen hierarchy, grouping, contrast, alignment, and progressively disclosed competition views are based on [Figma’s UI design principles](https://www.figma.com/resource-library/ui-design-principles/).

## Visual system

| Role | Treatment |
|---|---|
| Brand | Plum ink `#211A2B`, coral tile `#FFA184`, and citron `#DFEF9D` for positive emphasis and line clears. |
| Light and dark | Warm paper with aubergine text in light. Layered plum surfaces with cream text in dark. High contrast uses explicit board edges and cell symbols. |
| Typography | Bricolage Grotesque ExtraBold for display, Instrument Sans for body and controls, optional Atkinson Hyperlegible, and Noto Sans Devanagari for Hindi and Marathi. Score readouts request tabular numerals. |
| Spacing | Base steps 4, 8, 12, 16, 24, and 32 logical pixels. Screen inset is 16 on compact displays and 24 on wider screens. Cards use 20 radius, with 26 reserved for major panels. |
| Board | Dark wells and coloured tiles share one frame; preview uses shape boundaries, + or ×, and a text status. The three tray slots stay aligned. Buttons use a minimum 52 height and flexible text. |

Theme and palette settings affect appearance only. Occupied tiles retain their color index, piece colours are generated separately from shapes, and game rules and records stay with the shared engine. [Theme tokens](../app/src/design.ts)

## Motion pass

| Moment | Choreography | Reduced motion and low effects |
|---|---|---|
| Button press and release | Compress the label briefly over 76 ms. Release over 145 ms. The pressed treatment responds immediately. | Static pressed treatment. |
| Screen arrival | 185 ms opacity and a 6 px rise. The live board uses opacity to keep drag coordinates stable. | Immediate destination. |
| Tray selection | 3 px lift over 145 ms. The selection outline and label are immediate. | Outline and Selected label. |
| Confirmed tile | 185 ms vertical compression, mild rebound, and settle. Tap and drag remain available. | Tile is placed immediately. |
| Line clear | 390 ms wave driven by cell distance from the confirmed move. Each cleared cell lights briefly and contracts along the same row or column. One shared clock keeps simultaneous clears together. | Immediate board update and text with lines and points. |
| Score | 275 ms, 4 px lift for a new confirmed scoring move. The value updates immediately. | Immediate value update. |
| Result | 480 ms anticipation and settle as the citron tile locks into place. Round score, saved progress, personal record and match status are readable immediately. | Static lock-up. |

Use platform-native transform and opacity with hand-authored curves. Keep overlays outside the touch path. Skip move feedback on resume, replay, undo, or when receiving the same confirmed move again. Keep the timing values in `design.ts` and playback in the screen, board, and result components.

The motion pass applies staging, anticipation, follow-through, and custom easing. References include [OpenClassrooms](https://openclassrooms.com/en/courses/5625816-create-modern-css-animations/5794716-apply-the-12-principles-of-animation-to-the-web), [User Interface Wiki](https://www.userinterface.wiki/12-principles-of-animation), [CSS Animation](https://cssanimation.rocks/), [SVGator’s inspiration archive](https://www.svgator.com/blog/tag/inspirational/), and [Tubik’s mobile interaction case study](https://tubikstudio.com/works/watering-tracker).

## Review checklist

### Interaction surfaces

- Use the shared Toast for immediate feedback. Confirmations use the shared Dialog, put the safe action first, and name the action and consequence. Error toasts stay until dismissal. Timed toasts pause while their dismiss button has keyboard focus.
- Use the shared Overlay for preview, family handoff, and the Notifications drawer. The floating drawer rises from the bottom on phones and opens on the right on wider screens. Notification cards use the game's tile colours and open the associated match directly. Dialog and drawer contents scroll when type or viewport size requires it. The 210 ms entrance respects the effective motion setting.
- Store inbox items by profile. An opened match can show confirmed results via the inbox. Deadline and break reminders respect quiet mode and the one-hour mute. A break reminder leaves the board and any open confirmation in place.
- Label offline async points as local while they await verification. Conflicting or expired drafts can be kept or explicitly discarded in favour of the confirmed board.

Play through first run, resume, preview and confirm, line clear, result, and rematch. Run `npm run test:motion` after exporting the web build to compare standard motion, system reduced motion, Low effects, and the app's motion switch. Set `BLOCK_LEAGUE_MOTION_CAPTURES` to a directory to record screenshots and video from that pass. Inspect narrow phones at 200% text, high contrast, and two browser clients on a private match. Confirm outcome legibility with sound off and complete the physical Android and iOS checks for touch, haptics, assistive technology, and frame pacing.
