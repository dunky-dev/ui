# @dunky.dev/solid-use-scroll-lock

## 0.1.1

### Patch Changes

- [#48](https://github.com/dunky-dev/ui/pull/48) [`4208569`](https://github.com/dunky-dev/ui/commit/4208569ecad4b141ecdf814ae195bcc0e14a7afc) Thanks [@ivanbanov](https://github.com/ivanbanov)! - `useScrollLock` now treats a `null` target as "no target yet" and locks
  nothing. Previously `null` collapsed into "the page body", so passing a
  not-yet-resolved element (e.g. `ref.current` on the first run) locked the
  page instead of the intended container — and never corrected itself. An
  omitted target still means the page body.

  Pass the element through something reactive so the lock engages once the
  node resolves — in React hold it in state (a ref populating doesn't
  re-render), in Solid pass a signal-backed element (a plain `ref` read is
  not reactive):

  ```tsx
  // React
  const [panel, setPanel] = useState<HTMLElement | null>(null)
  useScrollLock(open, panel) // locks nothing until the node resolves

  // Solid
  const [panel, setPanel] = createSignal<HTMLElement | null>(null)
  useScrollLock(open, panel)
  ```

- Updated dependencies [[`4208569`](https://github.com/dunky-dev/ui/commit/4208569ecad4b141ecdf814ae195bcc0e14a7afc), [`9d93cfc`](https://github.com/dunky-dev/ui/commit/9d93cfc638c75e8ee8c48a1ad51b2537645680cf)]:
  - @dunky.dev/dom-scroll-lock@0.1.2

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
