---
'@dunky.dev/vue-use-focus-trap': minor
'@dunky.dev/vue-use-scroll-lock': minor
---

New substrate: the Vue lifecycle wrappers over the framework-free DOM utils,
mirroring the React hooks one-for-one. `useFocusTrap(ref, options?)` follows
the target ref (a template ref fills after setup, so the trap arms when the
element appears and releases with it); `useScrollLock(locked?, target?)`
accepts `MaybeRefOrGetter` for both parameters so the lock tracks reactive
state. The behavior itself lives in `@dunky.dev/dom-focus-trap` and
`@dunky.dev/dom-scroll-lock` — these composables own only the lifecycle.
