# SPEC / DOM / Dialog

## Overview

The DOM half of the Dialog, shared by every DOM substrate — React, Solid, and
whatever comes next. Behavior is [`@dunky.dev/dialog`](../../../core/dialog/SPEC.md)'s;
this package owns the part of the wiring that is specific to the document but
not to any framework: the Escape listener, the focus and stack sequences around
the open and exit edges, the session-history guard, and the gating that decides
which press counts as an outside interaction.

It sits between the DOM utils and the substrate bindings:

```
  @dunky.dev/dialog        core behavior (no DOM)
          |
          v
  @dunky.dev/dom-dialog    this package -- DOM, no framework
          |     ^
          |     +--------- @dunky.dev/dom-overlay, -navigation, -focus-trap
          v
  @dunky.dev/<substrate>-dialog
```

A `dom/utils/*` package is primitive-agnostic and imports nothing from the
repo. A `dom/components/*` package is the opposite: it is about exactly one
primitive, so it may import that primitive's core package and any DOM util.
What it must not do is import a framework, or another primitive.

Substrate bindings are the only consumers. Each one supplies its host's
lifecycle — React's `useEffect`, Solid's `createEffect` — and calls into
these; none of them re-derives the order or the conditions.

## Behavior

### Document-level effects

`domDialogEffects` is the core's substrate-free effect list plus the Escape
listener, as the same plain-data tuples the core defines. A substrate passes
the list to its adapter's `useMachine` untouched.

Escape is bound on the document in the capture phase, not on a part: it must
answer wherever focus is. It closes only the topmost layer, so a nested stack
unwinds one dialog per press, and it offers the consumer's `onEscapeKeyDown` a
veto through `preventDefault` before it moves the machine.

### The open edge

`openDialogLayer` runs one ordered sequence and returns its exact inverse:

1. remember what had focus,
2. join the shared layer stack (which re-syncs assistive-tech containment),
3. move focus to the consumer's `initialFocus`, or the overlay's own choice,
4. fall back to the dialog window when that target refuses focus.

When the fallback misses too — the dialog window itself can't take focus,
typically because it lacks `tabindex="-1"` — focus is stranded outside the
layer, against the modal dialog pattern. That miss is loud: a `console.warn`
names the fix instead of failing silently.

The disposer releases the stack **before** restoring focus. Both orders are
load-bearing: the stack must exist before focus moves in, and the layers
beneath must be un-inerted before focus can land on one of them.

Every focus move passes `preventScroll` — the scroll lock has already frozen
the surface, so scrolling it would jump the view on open and again on close.

The edge is the machine's `open` state, not mount/unmount: an animated dialog
stays mounted through `closing`, and the stack, containment, and focus all
release the moment the exit starts.

### The exit window

`startExitWindow` covers the tail of an animated close, when the dialog is
mounted but no longer open. The layer has already left the stack, so the page
beneath is live again; the still-painting layer is taken out of interaction
and watched for the end of its visual, which the substrate forwards to the
machine as `exit.complete`. The disposer undoes both — it is the reopen
interrupt as much as the final unmount.

### Back navigation

`guardBackNavigation` plants the session-history entry that turns the host's
Back into a dismissal, and watches the entry a Back press spends so the host's
Forward reopens what it closed. It wires mechanics only: whether the dialog may
close or reopen, whether the consumer vetoed, and whether a controlled dialog
followed are all the core's answers, read back as "is it open".

The guard is an episode, not an open state, so it does not fit a single
lifecycle scope: the substrate reports every change through `sync(open)` and
ends it with `release()`. An open edge (re)arms; a close either parks the
registration — the Back press itself closed the dialog, so the spent entry is
still worth watching — or releases it, because a dialog closed any other way
has no way back. That decision is the reason the episode lives here: a
substrate that scoped the guard to "while open" would drop the Forward watch
with the close.

### Outside presses

A press dismisses only when it is genuinely outside and genuinely this
dialog's to answer:

- `acceptsBackdropPress` — the topmost dialog of a stack answers, nobody else.
- `acceptsViewportPress` — content presses bubble to the viewport, so the
  press must have started on the viewport itself, and then the same topmost
  rule applies.

### Focus trap

`dialogTrapOptions` is the trap configuration the substrate hands to its
`trapFocus` wrapper: a modal dialog traps while it is topmost, and the Close
part is the cycle's last stop wherever it renders.

## API

| Export                                | Description                                                             |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `domDialogEffects`                    | Core effects + the document Escape listener, as `DialogEffect` tuples.  |
| `openDialogLayer(content, options)`   | The open sequence; returns the close sequence.                          |
| `startExitWindow(content, options)`   | Hides and watches the still-painting layer; returns the undo.           |
| `guardBackNavigation(options)`        | The history guard episode: `sync(open)` per change, `release()` to end. |
| `acceptsBackdropPress(id)`            | Whether a backdrop press is this dialog's outside interaction.          |
| `acceptsViewportPress(id, event)`     | Same for the viewport, ignoring presses that bubbled from the content.  |
| `dialogTrapOptions(machine, closeId)` | `TrapFocusOptions` for the dialog window.                               |

## Constraints

- No framework import, ever — that is the whole point of the layer.
- No decisions of its own. Anything a substrate could answer differently
  belongs in the core machine; what lives here is only the DOM realization of
  a decision already made.
- Every entry point returns its own teardown — a disposer, or a `release` on a
  call that outlives one lifecycle scope — and it undoes exactly what the call
  did: substrate lifecycles differ, so nothing may rely on a particular
  teardown order between calls.
- Reads that must stay live (`modal`, the topmost check, the Close id) are
  taken as the machine or as accessors, never snapshotted at call time.

## Internals

| Position                                                       | Why                                                                                                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The open edge is one call, not a `registerLayer` + focus pair  | The two orders (join before focus in, release before focus out) are the contract; splitting them puts that ordering back in every substrate, where it drifted before. |
| `dialogTrapOptions` takes the machine rather than plain values | `modal` and the layer id are read per Tab press. Snapshotting them freezes the trap against a context the machine still owns.                                         |
| `closeId` is an accessor while the machine is not              | The machine instance is stable; the connected api that carries the ids is re-created per render.                                                                      |
| Press gating takes a structural `{ target, currentTarget }`    | React's synthetic event and Solid's native one share only that shape; requiring either would drag a framework type into this layer.                                   |
| The back guard reports state instead of returning a disposer   | Its life spans a Back-close, so no host's "while open" scope fits it. Reporting the open state keeps the arm/park/release decision here rather than in each host.     |
