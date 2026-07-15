# dom-__name__ — spec

The behavior contract lives in
[`../../core/__name__/SPEC.md`](../../core/__name__/SPEC.md). This spec covers
the DOM driver: instance lifecycle, event wiring, and what lives here vs in the
machine.

## Instance lifecycle

<!-- attach/detach/setOptions semantics; restartable across remounts; what an
idle instance costs (listeners); teardown guarantees. -->

TODO: describe the instance lifecycle.

## Event wiring

<!-- Which listeners bind to the element vs the document, and when they arm and
disarm. A listener-topology diagram helps — plain | - + only. -->

TODO: describe the listener topology.

## Browser quirks

<!-- The per-browser workarounds and why each exists. Link the bug or source
line for every one — a quirk without a reason is a future regression. -->

TODO: list the quirks.

## Positions

Statuses: `adopted` · `deferred` · `rejected`.

| Position | Why  | Status |
| -------- | ---- | ------ |
| TODO     | TODO | TODO   |
