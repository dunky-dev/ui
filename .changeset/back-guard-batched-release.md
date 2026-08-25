---
'@dunky.dev/browser-navigation': patch
---

Fix: releasing a whole guarded stack in one turn (close-all, a route change,
an unmounting subtree) only consumed the topmost guard's entry — each entry
beneath stayed behind and silently swallowed a later browser Back.

```ts
const releaseOuter = interceptBackNavigation(() => closeOuter())
const releaseInner = interceptBackNavigation(() => closeInner())

// "close all" — both released in the same turn
releaseInner()
releaseOuter()

history.back()
// before: ❌ nothing happens — spent on outer's leftover entry
// after:  ✅ leaves the page — every freed entry was consumed
```

Release order doesn't matter, and an entry genuinely buried under later
in-app navigation is still left alone.
