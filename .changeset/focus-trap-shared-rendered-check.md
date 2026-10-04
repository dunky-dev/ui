---
'@dunky.dev/dom-focus-trap': patch
---

The Tab cycle's rendered check now comes from `@dunky.dev/dom-element` instead
of a private copy.

`@dunky.dev/dom-overlay` needs the same predicate to filter its initial-focus
candidates, and two packages answering the question separately would drift.
The check itself is unchanged in intent — a non-rendered element is a no-op to
focus, so keeping one in the cycle would stall the trap on it — but sharing it
tightens two cases:

- A **detached** element is now excluded. It can't take focus, and computed
  style on one reports the property defaults rather than `none`, so the display
  walk alone let it through.
- A `display: none` ancestor **above the container** now excludes the
  focusables under it. The private copy stopped its walk at the container.
  Nothing inside a hidden container can take focus either way, so this lands on
  the trap's documented behavior for an empty cycle: Tab is a no-op.
