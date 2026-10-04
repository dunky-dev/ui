# @dunky.dev/solid-use-focus-trap

## 0.1.1

### Patch Changes

- Updated dependencies [[`560d539`](https://github.com/dunky-dev/ui/commit/560d539dac5d2ed4b318b9ddad08f9717ddb8f00), [`6ed64a2`](https://github.com/dunky-dev/ui/commit/6ed64a213a42f2f03d07759afd84b456fd753218)]:
  - @dunky.dev/dom-focus-trap@0.1.2

## 0.1.0

### Minor Changes

- [#44](https://github.com/dunky-dev/ui/pull/44) [`4480950`](https://github.com/dunky-dev/ui/commit/4480950cd629beb214c36da0db4f0eab3e9e1341) Thanks [@ivanbanov](https://github.com/ivanbanov)! - New substrate: the Solid lifecycle wrappers over the framework-free DOM utils,
  mirroring the React hooks one-for-one and targeting Solid 2.0 (peer
  `solid-js@^2.0.0-rc.1`). `useFocusTrap(target, options?)` takes an accessor
  for the container (a plain ref variable fills during render, so the trap arms
  on mount and re-arms when a reactive accessor yields a new element);
  `useScrollLock(locked?, target?)` accepts a `MaybeAccessor` for both
  parameters so the lock tracks reactive state. The behavior itself lives in
  `@dunky.dev/dom-focus-trap` and `@dunky.dev/dom-scroll-lock` — these
  primitives own only the lifecycle.
