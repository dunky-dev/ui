# @dunky.dev/dom-interact-outside

Framework-free document-level outside-interaction detection for non-modal
overlays (popover, menu, combobox) — the ones with no backdrop to catch
presses. `trackInteractOutside` attaches capture-phase `pointerdown` and
`focusin` listeners on the document and fires `onInteractOutside` when the
event target falls outside the container's subtree and isn't excused by the
`ignore` predicate — how the caller excludes nested layers and its
trigger/anchor. One gesture reports once: the `focusin` a press dispatches by
moving focus is folded into that press, never a second call. A touch press
reports only once its `click` confirms a tap, so a scroll or pan that starts
outside never dismisses. Pure detection: dismissal decisions stay with the
caller.

Substrate hooks wrap this — e.g. `@dunky.dev/react-use-interact-outside` — so
every framework inherits identical detection behavior.

## Install

```sh
npm install @dunky.dev/dom-interact-outside
```

## Usage

```ts
import { trackInteractOutside } from '@dunky.dev/dom-interact-outside'

const release = trackInteractOutside(panel, {
  onInteractOutside: event => dismiss(event),
  // A press in a nested layer or on the anchor never counts as outside.
  ignore: target => layerContainsTarget(id, target) || anchor.contains(target),
})

// later
release()
```
