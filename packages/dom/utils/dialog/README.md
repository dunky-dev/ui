# @dunky.dev/dom-dialog

Framework-free DOM behavior for dialog substrates. One shared module owns
what every substrate's dialog must agree on:

- **The layer stack** — `registerDialog` / `isTopmostDialog`. Every open
  dialog registers a layer; the topmost (deepest nesting, open order breaking
  ties) is the one Escape and the focus trap act on. While the topmost layer
  is modal, everything outside its content is marked `aria-hidden` + `inert`,
  except the layer's own backdrop — rendered outside the content's subtree
  yet part of the layer, it must stay pressable for outside-press dismissal.
  Unregistering restores exactly what was hidden and re-syncs for the layer
  beneath.
- **Initial focus** — `getInitialFocus` resolves where focus moves on open: a
  dialog that collects input starts at its first form field; any other
  content keeps focus on the dialog window itself.
- **Back navigation** — `interceptBackNavigation` plants a guard entry in the
  session history so the host's Back closes the dialog instead of leaving the
  page. Guards stack in open order, so a nested stack unwinds one layer per
  press; a declined close (veto, controlled) re-arms the entry; releasing
  consumes a still-current entry so it can't swallow the next Back, and a
  synchronous release + re-register adopts the entry in place — no traversal,
  no race.
- **The exit window** — an animated dialog leaves the stack the moment it
  starts closing, but keeps painting until its exit visual finishes.
  `hideExitingLayer` takes the still-painting layer out of the page's
  interaction (`inert`: pointer, tab order, assistive tech) for that window,
  and `watchExitAnimation` reports when the visual finished — on the
  element's own `transitionend`/`animationend`, immediately under
  `prefers-reduced-motion`, or at a fallback ceiling so a missing exit style
  can't hang the close. Both return a cancel/undo for the reopen interrupt.

Substrate bindings wrap this — e.g. `@dunky.dev/react-dialog` — so every
framework shares one stack: dialogs from different substrates on the same
page stack, hide, and unwind correctly against each other.

## Install

```sh
npm install @dunky.dev/dom-dialog
```

## Usage

```ts
import { getInitialFocus, isTopmostDialog, registerDialog } from '@dunky.dev/dom-dialog'

// On open: join the stack, then move focus in.
const unregister = registerDialog({
  id,
  depth, // nesting level, 1 = top-level
  element: content, // the dialog window
  modal: true,
  backdrop: () => backdropElement, // stays pressable while topmost
})
getInitialFocus(content).focus({ preventScroll: true })

// Escape, outside-press, focus trapping: only the topmost layer answers.
if (isTopmostDialog(id)) {
  // ...
}

// On close: leave the stack; the layer beneath is restored.
unregister()
```
