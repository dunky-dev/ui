---
'@dunky.dev/native-dialog': minor
'@dunky.dev/dialog': minor
'@dunky.dev/react-dialog': patch
---

Add `@dunky.dev/native-dialog` — the React Native binding for the dialog, the
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
