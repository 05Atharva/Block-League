# Block League

Block League is a mobile-first, silent-first puzzle game. The primary audience is adults playing with friends, and the same core loop must work for first-time players, children with guardian controls, busy adults resuming saved games, and older players who need comfortable controls.

## Work from the player stories

- Read [the product spec](docs/PRODUCT-SPEC-v0.1.md#9-exactly-50-user-stories) and [coverage matrix](docs/50-STORY-COVERAGE.md) before changing a flow. The product spec records original proposals. [Design and motion](docs/DESIGN-AND-MOTION.md) describes the current interface.
- Keep Solo one tap from Play after setup, show a saved board before offering a fresh one, and disclose duel limits before entry. Keep team and season detail within Club.
- Preserve the confirmed placement flow, personal versus verified records, private aliases, child privacy gates, rule versioning, and authoritative scoring. Visual changes belong in the client. Rules are shared in `shared/` and competitive results are adjudicated by `server/`.
- Recognize real events such as a line clear, completed round, earned badge, or verified result. Keep exits easy and preserve earned progress.

## Design and engineering

- Read the [app guide](app/AGENTS.md) before editing the client. Use the Block League mark, semantic themes, and shared UI primitives.
- Author app motion by hand using React Native's built-in Animated primitives. Keep reduced motion, low-effects mode, and visual/text cues in every relevant flow.
- Keep dependencies pinned by the root and app lockfiles. Keep private data, local environment files, and installed dependencies outside Git. The checked-in `app/web-dist` is the runnable browser distribution, including its exported assets.

## Validation

Run `npm test` and `npm run check`. For UI changes, run `npm run build:web` and `npm run test:ui`, then inspect the changed screens at narrow phone width in light and dark. Run `npm run test:motion` for changes to motion and `npm run test:interactions` for overlays, notifications, and offline submission. Check high contrast, 200% text, and keyboard navigation as applicable. Update the exported browser build for changes visible in the client. Attribute browser evidence to browser checks and record physical-device checks separately.
