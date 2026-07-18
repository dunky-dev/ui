# @dunky.dev/react-toast

React binding for [`@dunky.dev/toast`](../../core/toast): a compound
component — `Toast` plus its parts — that drives the framework-free toast
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers, and wire the DOM-only concerns
(the dismiss timer, the provider/viewport pause broadcast).

Behavior contract: [`../../core/toast/SPEC.md`](../../core/toast/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-toast
```

## Usage

```tsx
import { Toast } from '@dunky.dev/react-toast'

function Notifications() {
  return (
    <Toast.Provider label='Notifications'>
      {/* app */}
      <Toast.Viewport>
        <Toast>
          <Toast.Root>
            <Toast.Title>Saved</Toast.Title>
            <Toast.Description>Your changes are safe.</Toast.Description>
            <Toast.Action>Undo</Toast.Action>
            <Toast.Close>Dismiss</Toast.Close>
          </Toast.Root>
        </Toast>
      </Toast.Viewport>
    </Toast.Provider>
  )
}
```
