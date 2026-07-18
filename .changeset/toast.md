---
'@dunky.dev/toast': minor
'@dunky.dev/react-toast': minor
---

Add the Toast primitive — a declarative, Radix-style toast (one component per
toast, not an imperative toaster store), shipped as an agnostic core
(`@dunky.dev/toast`) plus a React binding (`@dunky.dev/react-toast`).

A toast announces as a `role="status"` live region (`assertive` for the
`foreground` type, `polite` for `background`), auto-dismisses after its
duration (`Infinity` = persistent), and pauses every timer while the viewport
is hovered or focused — resuming restarts the full duration, a documented
deviation from Radix that keeps the timer contract inside the state machine.
Dismissing the toast that holds keyboard focus parks focus on the viewport
(`tabindex="-1"`), so the user keeps their place and the hover/focus pause
tracking stays truthful.

```tsx
import { Toast } from '@dunky.dev/react-toast'

function App() {
  return (
    <Toast.Provider label='Notifications' duration={5000}>
      {/* app */}
      <Toast.Viewport>
        <Toast onOpenChange={console.log}>
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
