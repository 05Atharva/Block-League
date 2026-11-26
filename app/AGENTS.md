This is the Expo/React Native client for Block League. Read the [repo instructions](../AGENTS.md), [player stories](../docs/PRODUCT-SPEC-v0.1.md#9-exactly-50-user-stories), and [design and motion guide](../docs/DESIGN-AND-MOTION.md).

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- The current client uses one navigation state in `App.tsx`. Use its screen transitions and back behavior for existing flows. Preserve solo autosave and the leave-match confirmation.
- Locate primary Solo, Face-Off and team entry in `src/PlayHome.tsx`, shared UI in `src/ui.tsx`, theme roles in `src/design.ts`, and board controls in `src/Board.tsx`.
- Apply the same spacing and typography roles in light, dark and high contrast. Let 200% text and longer Hindi and Marathi strings reflow. Keep the board a usable width and keep controls reachable without audio, motion or precision dragging.
- Use `src/motion.tsx` and the shared timings for authored motion. Trigger game feedback from confirmed changes, keep touch targets stationary, and verify the system reduced-motion setting and the app's Low effects switch. Keep overlays out of the touch path.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
- Check the browser export, font licenses, and brand assets when changing the visual system. Verify native-only gestures, haptics and assistive technology on devices before claiming device support.
