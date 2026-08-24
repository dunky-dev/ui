---
'@dunky.dev/dom-focus-trap': patch
---

Make the trap's Tab cycle match what a browser would actually focus.

Three fixes, all consumer-visible:

- **The trap now intercepts Tab from anywhere in the document.** The keydown
  listener moved from the container to the document (capture phase), so a Tab
  pressed while focus is still outside — on the trigger, or on `body` — wraps
  into the cycle at the edge instead of following native tab order out of the
  trap. Initial focus on open remains the caller's job.
- **Non-rendered elements no longer enter the cycle.** Elements hidden via the
  `hidden` attribute, `display: none` (own or ancestor), or
  `visibility: hidden` are filtered out with `Element.checkVisibility()`.
  Focusing a non-rendered element is a no-op, so a hidden element in the cycle
  used to stall the trap on it.
- **A same-name radio group is one tab stop.** Per the APG radio group
  pattern, the stop is the checked radio, else the group's first; groups are
  scoped by name and form owner. The trap steps focus itself, so it now
  reproduces the browser's grouping instead of visiting every radio.
