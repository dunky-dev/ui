# Agents / native substrate

React Native bindings. Everything in the root `AGENTS.md` applies; only the
host differs:

- **No DOM.** The DOM utils (`packages/dom/**`) don't exist here. Host
  presentation — layering, behind-blocking, accessibility containment,
  hardware back — comes from React Native's own primitives (`Modal`,
  `accessibilityViewIsModal`), but every _decision_ still flows through the
  core machine: the binding wires host mechanics to the machine's
  events/api and adds no behavior of its own.
- **One adapter.** A binding imports `@dunky.dev/native-state-machine` only —
  it re-exports the React lifecycle (`useMachine`; RN renders through React)
  alongside the native `normalize`/`mergeProps` translation.
- **Tests run through react-native-web.** The root vitest config aliases
  `react-native` to `react-native-web`, so binding tests render with
  `@testing-library/react` in jsdom like every other substrate. Behavior that
  only exists on-device (hardware back) is exercised through RNW's
  equivalents (its `Modal` maps Escape to `onRequestClose`).
- **One story source, two Storybook runners.** The browser harness renders
  through react-native-web (`pnpm dev native` from the repo root) — the fast
  iteration loop. The on-device runner is an Expo shell over the same story
  files (`pnpm -C packages/native ondevice:ios` / `:android`) — the host
  truth: real `Modal`, real hardware back, real touch, Metro resolution.
  Anything RNW can only approximate gets verified there before it ships.
