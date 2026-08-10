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
- **Tests render through react-native-web, headless.** The root vitest config
  aliases `react-native` to `react-native-web`, so binding tests render with
  `@testing-library/react` in jsdom — `react-native-web` here is just the
  render target that lets RN components run under vitest (RN's own source
  ships untranspiled Flow that the bundler would choke on); it is not a
  storybook or a host. The tests cover host-agnostic logic (the machine
  wiring: open/close, controlled, outside-press, back-as-escape). Host truth
  is not their job — that's the on-device runner.
- **Storybook is on-device only.** An Expo shell renders the stories on a real
  simulator/device (`pnpm -C packages/native ondevice:ios` / `:android` /
  `ondevice`) — real `Modal`, real hardware back, real touch, real VoiceOver,
  Metro resolution. There is no browser storybook: react-native-web fakes the
  host, so it can't verify what this substrate exists to get right. Anything
  the unit tests can't reach is verified here.
