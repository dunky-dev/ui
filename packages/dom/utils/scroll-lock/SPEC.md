# SPEC / DOM / Scroll lock

## Overview

Framework-free, reference-counted scroll lock for any scroll container — the
page body by default. It is the mechanics behind the overlay scroll contract
(the page behind a modal layer doesn't scroll, and hiding its scrollbar
doesn't shift the layout); substrate hooks wrap it (e.g.
`@dunky.dev/react-use-scroll-lock`) so every framework inherits identical
behavior.

## Behavior

- **One shared lock per container.** The first holder saves the target's
  inline style state and the last release restores it, so overlapping
  holders — nested modal layers — can release in any order.
- **No layout shift.** Locking pads for the vanished scrollbars using
  logical properties: the vertical scrollbar always sits at `inline-end`
  (right in LTR, left in RTL) and the horizontal one at `block-end`, so
  writing direction is handled for free. The footprint is added on top of
  the target's computed padding, not assigned over it. A zero-width
  scrollbar (overlay scrollbars, or none) adds no padding.
- The body's scrollbars live on the viewport and are measured from the
  window; any other container owns its scrollbars, measured from its own
  boxes (borders excluded).
- A release is idempotent — releasing twice can't double-decrement another
  holder's count.

## API

| Export                | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `lockScroll(target?)` | Locks `target` (default `document.body`); returns the release. The target restores when its last holder releases. |

## Constraints

- Restore returns the target's inline style to exactly what the first
  holder saw.
- The registry is shared across duplicate copies of the module on the same
  page.
- A body lock relies on overflow propagation: per CSS Overflow 3 the
  body's `overflow` applies to the viewport only while `html` computes to
  `visible` in both axes, so a host page with e.g.
  `html { overflow-y: scroll }` keeps scrolling. A host-environment
  limitation, not addressable here.

## Internals

| Position                                                                      | Why                                                                                                                                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The registry anchors on a realm-global keyed by `Symbol.for`, resolved lazily | Duplicate module copies (monorepo, micro-frontend) would double-lock or leak the lock — the duplicate-singleton bug class of radix-ui/primitives#2815. Lazy keeps `sideEffects: false` honest. |
| Restore assigns saved values via `setProperty`, not the camelCase setters     | A saved `''` (originally unset) must remove the declaration, which `setProperty` does per CSSOM.                                                                                               |
| Overflow is saved, hidden, and restored per axis, never via the shorthand     | The `overflow` shorthand serializes back to `''` unless both longhands are set, so a container scrolling on one axis (`overflow-y: auto`) would save as unset and restore by removing it.      |
