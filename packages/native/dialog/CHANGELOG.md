# @dunky.dev/native-dialog

## 0.1.2

### Patch Changes

- Updated dependencies [[`ffa4fad`](https://github.com/dunky-dev/ui/commit/ffa4fada7719daa8661adab52c20952f3d8d7559), [`6b51d8d`](https://github.com/dunky-dev/ui/commit/6b51d8de4d1069863a56c7ac5f74cb3c8dfaa20c)]:
  - @dunky.dev/dialog@0.4.0

## 0.1.1

### Patch Changes

- [#44](https://github.com/dunky-dev/ui/pull/44) [`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Update the state-machine packages to the 2026-08-22 release: runtime `0.3.3`,
  bindings `0.4.1`, utils `0.4.0`, and the React (`0.3.4`), Solid (`0.3.0`), and
  native (`0.4.0`) adapters.

  Every range moves together on purpose. The published adapters pin the runtime
  exactly (`@dunky.dev/state-machine: 0.3.3`), so a package left on an older
  caret would have pulled a second physical copy of the runtime into a consumer's
  install — the dependency diamond `ARCHITECTURE.md` warns about, where anything
  identity-sensitive (a singleton, a `WeakMap`, module-level state) silently stops
  agreeing across the two copies. `@dunky.dev/controllable` was the oldest
  offender, still on `^0.1.0`; the tree now resolves to a single runtime.

- Updated dependencies [[`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071)]:
  - @dunky.dev/dialog@0.3.1

## 0.1.0

### Minor Changes

- [#33](https://github.com/dunky-dev/ui/pull/33) [`8c0dde3`](https://github.com/dunky-dev/ui/commit/8c0dde3249d867de7fd556ba02f2bef26687f869) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Hardware Back now dismisses the dialog by default: `closeOnBack` defaults to `true` on the native substrate (the core default stays `false`).

  Back is Android's dismiss gesture for transient surfaces — native `Dialog`s are `cancelable` by default — and it plays the same role Escape does on the web, where `closeOnEscape` already defaults to `true`. Requiring an opt-in inverted that platform expectation. Opt out per dialog with `closeOnBack={false}`; the `onBackNavigation` veto is unchanged.

- [#33](https://github.com/dunky-dev/ui/pull/33) [`21cc0b8`](https://github.com/dunky-dev/ui/commit/21cc0b82d858789ea0e6a90a7e8d65f4a773d669) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Add `@dunky.dev/native-dialog` — the React Native binding for the dialog, the
  first package of the native substrate. Same compound API as the React
  binding; the parts translate the core's logical bindings into React Native
  props (`onPress`, `accessibilityState`, `accessibilityViewIsModal`), the
  Portal renders the host's `Modal`, and the hardware Back press reports
  through the core `closeOnBack` contract.

  ```tsx
  import { Dialog } from '@dunky.dev/native-dialog'
  ;<Dialog>
    <Dialog.Trigger>
      <Text>Open</Text>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop />
      <Dialog.Viewport>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Close>
            <Text>Close</Text>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
  ```

  `@dunky.dev/dialog` now exports `dialogEffects` — the substrate-free effect
  list (the controlled-open echo) every binding consumes instead of
  re-implementing, so the controlled contract can't fork between substrates. A
  substrate composes its host-specific effects around it (the React binding
  adds its DOM Escape listener); the echo itself is written once, in core.

### Patch Changes

- [#33](https://github.com/dunky-dev/ui/pull/33) [`b02dc81`](https://github.com/dunky-dev/ui/commit/b02dc81c524e19dd660bf342ed9583ee91e6b6ee) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Update the state-machine runtime packages to 0.3.2.

  For `@dunky.dev/native-dialog` this fixes a native crash on Android: the runtime's `normalize` used to emit the machine's `role: 'dialog'` as the legacy `accessibilityRole` prop, which Android rejects at mount (`Invalid accessibility role value: dialog`). It now emits React Native's web-aligned `role` prop, which also restores the intended semantics on iOS (VoiceOver previously got no dialog traits at all). `hidden` now lands on `aria-hidden` instead of being silently ignored.

- Updated dependencies [[`21cc0b8`](https://github.com/dunky-dev/ui/commit/21cc0b82d858789ea0e6a90a7e8d65f4a773d669), [`b02dc81`](https://github.com/dunky-dev/ui/commit/b02dc81c524e19dd660bf342ed9583ee91e6b6ee)]:
  - @dunky.dev/dialog@0.3.0
