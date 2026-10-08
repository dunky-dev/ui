---
'@dunky.dev/vue-use-focus-trap': minor
'@dunky.dev/vue-use-scroll-lock': minor
---

New substrate: the Vue lifecycle wrappers over the framework-free DOM utils,
mirroring the Solid primitives' shape (peer `vue@^3.3.0`).
`useFocusTrap(target, options?)` and `useScrollLock(locked?, target?)` take a
`MaybeRefOrGetter` — a template ref, a getter, or the element — and follow it
reactively. Both start on mount, when a template ref has filled, and never
run during server rendering; a `<KeepAlive>` deactivation releases them like
an unmount and reactivation picks them back up, as React's `<Activity>` does.
The behavior itself lives in `@dunky.dev/dom-focus-trap` and
`@dunky.dev/dom-scroll-lock` — these composables own only the lifecycle.
