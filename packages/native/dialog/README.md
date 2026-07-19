# @dunky.dev/native-dialog

React Native binding for [`@dunky.dev/dialog`](../../core/dialog): a compound
component — `Dialog` plus its parts — that drives the framework-free dialog
machine. The root owns the machine; parts translate the core's logical
bindings into React Native props, and wire the host-only concerns (the
`Modal` layer, the hardware back).

Behavior contract: [`../../core/dialog/SPEC.md`](../../core/dialog/SPEC.md).
Native-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/native-dialog
```

## Usage

```tsx
import { Text, Button } from 'react-native'
import { Dialog } from '@dunky.dev/native-dialog'

function ConfirmDelete() {
  return (
    <Dialog>
      <Dialog.Trigger>
        <Text>Delete...</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Viewport>
          <Dialog.Content>
            <Dialog.Title>Delete file?</Dialog.Title>
            <Dialog.Description>This cannot be undone.</Dialog.Description>
            <Button title='Delete' onPress={() => {}} />
            <Dialog.Close>
              <Text>Cancel</Text>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  )
}
```
