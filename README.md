<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/dunky-dev/logo/main/logo-white%402x.png" />
    <img src="https://raw.githubusercontent.com/dunky-dev/logo/main/logo%402x.png" alt="Dunky" width="400px" />
  </picture>
</p>

# UI

**Dunky's components — behavior written once, rendered anywhere.**

This repo is where the components live, and everything needed to render them.
Each primitive is built in layers: its behavior is modeled once as a
framework-free state machine (the **core**), DOM-specific logic is shared once
across every DOM host (the **DOM half**), and a thin **substrate** binding per
host environment puts it on screen. Add a substrate and every primitive shows
up there with the same behavior and the same a11y.

```
             +-------------------------+           +-------------------------+
             |       core/<name>       |           |        utilities        |
             |                         |           |                         |
             |    state machine per    |           |  focus-trap, viewport,  |
             |    primitive: states,   |           |   scroll-spy, overlay,  |
             |       events, a11y      |           |     scroll-lock, ...    |
             +------------+------------+           +------------+------------+
                          |                                     |
                          +------------------+------------------+
                                             |
                       agnostic: no env assumptions, no framework
                                             |
                          +------------------+------------------+
                          v                                     v
                   +-------------+   platform-specific   +-------------+
                   |     dom     | implementation of the |    native   |
                   +------+------+ agnostic core + utils +------+------+
                          |                                     |
    +----------+----------+----------+----------+               |
    v          v          v          v          v               v
+--------+ +--------+ +--------+ +--------+ +--------+   +--------------+
| react  | | solid  | |  vue   | | svelte | | others |   | react-native |
+--------+ +--------+ +--------+ +--------+ +--------+   +--------------+
              substrates: glue code, thin connectors to each host

```

The engine that runs the core machines lives in its own repo:
[dunky-dev/state-machine](https://github.com/dunky-dev/state-machine). Here it
is just a dependency — this repo defines _what_ each primitive does and how it
renders, not how machines execute.

## Layout

`packages/` is a grid: one directory per layer, one package per primitive.

- **`core/`** — the behavior. One package per primitive: a framework-free
  state machine. No DOM, no framework. Published as `@dunky.dev/<name>`.
- **`core/utils/`** — agnostic utilities shared across primitives: the logic
  every host needs but no host owns (controlled/uncontrolled state, the
  overlay-layer stack). No env assumptions, no framework. A platform layer
  extends them for its host (`dom/utils/overlay` builds on `core/utils/overlay`).
  Published as `@dunky.dev/<name>`.
- **`dom/utils/`** — framework-free DOM utilities shared across primitives
  and substrates (focus trap, scroll lock, overlay stacking). Published as
  `@dunky.dev/dom-<name>`.
- **`dom/components/`** — the framework-free DOM half of one primitive:
  logic that is DOM-specific but not framework-specific (document listeners,
  ordered focus sequences), written once and shared by every DOM host.
  Published as `@dunky.dev/dom-<name>`.
- **`<substrate>/`** — the render. A thin binding per host (`react/`,
  `solid/`, `vue/`, `native/`) that wires the machine to real elements.
  Published as `@dunky.dev/<substrate>-<name>` (e.g. `@dunky.dev/react-dialog`).

The layers build one way: `core -> dom -> substrate`. A binding
adds no behavior of its own — if a decision is needed, it moves into the core
machine so every substrate inherits it. The deep reference is
[ARCHITECTURE.md](./ARCHITECTURE.md).

The native scripts need a device toolchain (Xcode / Android SDK) and a
one-time dev build — see [packages/native/README.md](./packages/native/README.md).

## License

[MIT](./LICENSE)
