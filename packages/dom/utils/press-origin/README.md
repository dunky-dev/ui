# @dunky.dev/dom-press-origin

Framework-free tracking of where a pointer press began — kept past the
browser's click-target collapse.

A mousedown inside an element and a mouseup outside it fire `click` on their
common ancestor, not where the press started. Any "click outside dismisses"
surface misreads a text-selection drag because of that collapse; this util
captures the origin at `pointerdown`, the last moment it is still observable.

## Install

```sh
npm install @dunky.dev/dom-press-origin
```

## Usage

```ts
import { trackPressOrigin } from '@dunky.dev/dom-press-origin'

const tracker = trackPressOrigin(panel)

document.addEventListener('click', event => {
  // A drag that began inside the panel is not an outside press,
  // wherever the click's own target ended up.
  if (tracker.startedInside()) return
  if (!(event.target instanceof Node) || panel.contains(event.target)) return
  dismiss()
})

// later
tracker.dispose()
```
