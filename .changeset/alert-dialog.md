---
'@dunky.dev/alert-dialog': minor
'@dunky.dev/react-alert-dialog': minor
---

Add the AlertDialog primitive — a modal confirmation dialog following the
WAI-ARIA APG alertdialog pattern, shipped as an agnostic core
(`@dunky.dev/alert-dialog`) plus a React binding
(`@dunky.dev/react-alert-dialog`). It interrupts the user and requires a
response: always modal, an outside press never dismisses it, Escape closes
(vetoable via `onEscapeKeyDown`), and initial focus lands on Cancel — the
least destructive answer.

Controlled `open` is truly controlled: every open/close intent — trigger
press, Escape, Cancel/Action — is reported through `onOpenChange`, but the
alert dialog only moves when the prop does. Ignoring a report is a working
veto, so a consumer can hold the alert dialog open until an async destructive
operation resolves. Prop-driven transitions are not echoed back through
`onOpenChange`.

```tsx
import { AlertDialog } from '@dunky.dev/react-alert-dialog'

function App() {
  return (
    <AlertDialog onOpenChange={console.log}>
      <AlertDialog.Trigger>Delete...</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Viewport>
          <AlertDialog.Content>
            <AlertDialog.Title>Delete file?</AlertDialog.Title>
            <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action>Delete</AlertDialog.Action>
          </AlertDialog.Content>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}
```
