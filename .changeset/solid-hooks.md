---
'@dunky.dev/solid-use-focus-trap': minor
'@dunky.dev/solid-use-scroll-lock': minor
---

New substrate: the Solid lifecycle wrappers over the framework-free DOM utils,
mirroring the React hooks one-for-one and targeting Solid 2.0 (peer
`solid-js@^2.0.0-rc.0`). `useFocusTrap(target, options?)` takes an accessor
for the container (a plain ref variable fills during render, so the trap arms
on mount and re-arms when a reactive accessor yields a new element);
`useScrollLock(locked?, target?)` accepts a `MaybeAccessor` for both
parameters so the lock tracks reactive state. The behavior itself lives in
`@dunky.dev/dom-focus-trap` and `@dunky.dev/dom-scroll-lock` — these
primitives own only the lifecycle.
