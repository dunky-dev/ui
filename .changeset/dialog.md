---
'@dunky.dev/dialog': minor
'@dunky.dev/react-dialog': minor
---

Add the Dialog primitive — a modal dialog following the WAI-ARIA APG pattern,
shipped as an agnostic core (`@dunky.dev/dialog`) plus a React binding
(`@dunky.dev/react-dialog`).

```tsx
import { Dialog } from '@dunky.dev/react-dialog'

function App() {
  return (
    <Dialog onOpenChange={console.log}>
      <Dialog.Trigger>Delete...</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Viewport>
          <Dialog.Content>
            <Dialog.Title>Delete file?</Dialog.Title>
            <Dialog.Description>This cannot be undone.</Dialog.Description>
            <Dialog.Close>Cancel</Dialog.Close>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  )
}
```
