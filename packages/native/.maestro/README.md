# Maestro device E2E

The layer the unit tests can't reach. jest-expo renders the real react-native
tree but still mocks the host — the `Modal` mock unwraps to its children, touch
is synthetic, there's no hardware Back and no VoiceOver. These flows drive the
components on a real simulator/emulator/device, where those are real.

Scope, on purpose: only the host-integration claims from the SPEC's acceptance
list — real `Modal` layering, the `box-none` Viewport fall-through under real
touch, and Android hardware Back → `closeOnBack`. Everything host-agnostic
(the state-machine contract) is already covered faster by the jest-expo unit
tests; don't duplicate it here.

## Prerequisites

- The [Maestro CLI](https://maestro.mobile.dev) (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- A **dev build** running on a booted simulator/emulator or device — the flows
  target `appId: dev.dunky.ui` (the `app.json` bundle id), not Expo Go:

  ```sh
  pnpm -C packages/native ondevice:ios      # or :android
  # then, in another shell, once it's installed and running:
  ```

- The app showing the story a flow expects (each flow's header says which).
  The on-device Storybook persists the last selection, so pick it once.

## Run

```sh
maestro test packages/native/.maestro/dialog.yaml
maestro test packages/native/.maestro/dialog-back.android.yaml   # Android only
```

Not wired into CI — these need a device/emulator. Run them locally before
taking a native primitive out of experimental, and whenever a host-integration
detail (Modal, back, touch, a11y containment) changes.

## Flows

| Flow                       | Platform      | Verifies                                                                         |
| -------------------------- | ------------- | -------------------------------------------------------------------------------- |
| `dialog.yaml`              | iOS + Android | Modal opens; Close dismisses; outside tap falls through box-none to the Backdrop |
| `dialog-back.android.yaml` | Android       | Hardware Back closes when `closeOnBack` is set                                   |
