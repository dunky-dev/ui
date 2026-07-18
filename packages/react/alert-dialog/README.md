# @dunky.dev/react-alert-dialog

React binding for [`@dunky.dev/alert-dialog`](../../core/alert-dialog): a
compound component — `AlertDialog` plus its parts — that drives the
framework-free alert-dialog machine. The root owns the machine; parts
translate the core's logical bindings into DOM attributes and handlers, and
wire the DOM-only concerns (portal, focus trap, scroll lock, layer stack).

Behavior contract:
[`../../core/alert-dialog/SPEC.md`](../../core/alert-dialog/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-alert-dialog
```

## Usage

```tsx
import { AlertDialog } from '@dunky.dev/react-alert-dialog'

function ConfirmDelete() {
  return (
    <AlertDialog>
      <AlertDialog.Trigger>Delete...</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Viewport>
          <AlertDialog.Content>
            <AlertDialog.Title>Delete file?</AlertDialog.Title>
            <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action onClick={deleteFile}>Delete</AlertDialog.Action>
          </AlertDialog.Content>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}
```
