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
- **Tests run on jest-expo + `@testing-library/react-native`, not vitest.**
  Real react-native ships untranspiled Flow that vitest can't parse; jest-expo
  carries the RN + Expo transform allowlist. So `packages/native/**` is
  excluded from the root vitest and runs its own jest (`pnpm test:native`, and
  folded into `pnpm test:ci`). One `jest.config.cjs` serves every native
  primitive; it widens jest-expo's transform allowlist to the `@dunky.dev`
  scope and wraps its resolver to accept those packages' ESM-only `import`
  export. Tests render the real RN tree and assert the actual native props a
  device consumes (`accessibilityViewIsModal`, `pointerEvents`), plus behavior
  (open/close, controlled, outside-press, hardware back via the Modal's
  `onRequestClose`). No react-native-web anywhere.
- **Storybook is on-device only.** An Expo shell renders the stories on a real
  simulator/device (`pnpm -C packages/native ondevice:ios` / `:android` /
  `ondevice`) — real `Modal`, real hardware back, real touch, real VoiceOver,
  Metro resolution. There is no browser storybook: react-native-web fakes the
  host, so it can't verify what this substrate exists to get right.
- **Device E2E lives in each primitive's `tests-on-device/` folder.** Maestro flows
  (e.g. `dialog/tests-on-device/*.yaml`) drive the on-device components for the
  host-integration claims a mocked renderer can't reach (real Modal, box-none
  touch fall-through, real hardware Back). Device-run, not in CI — see the
  device-tests section in `README.md`. Run them before a primitive leaves
  experimental.
