---
'@dunky.dev/dialog': minor
'@dunky.dev/react-dialog': minor
'@dunky.dev/dom-dialog': minor
---

Add `closeOnBack` — the host's Back navigation closes the open dialog instead
of leaving the page, the pattern mobile users expect from a full-screen
overlay. Off by default.

```tsx
<Dialog closeOnBack onBackNavigation={event => /* preventDefault() vetoes */ {}}>
  …
</Dialog>
```

It follows the shared dismissal contract: `onBackNavigation` fires first and
`preventDefault()` vetoes, a controlled dialog only records the intent (close
it from your own state as usual), a nested stack unwinds one layer per Back
press, and it composes with `animated` (Back plays the exit animation). The
decision — gate, veto, controlled — lives once in the core's `backNavigate`;
substrates only wire their host's mechanics to it.

On the web (`@dunky.dev/dom-dialog`'s `interceptBackNavigation`), opening
plants a guard entry in the session history and Back consumes it. A dialog
closed any other way consumes its own entry too, so no leftover ever swallows
a later Back press — including across reopen races (React StrictMode's
double-invoked effects adopt the entry in place rather than queueing a
history traversal, which browsers don't reliably deliver once another entry
is pushed).
