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
                +---------------------------+
                |       core/<name>         |    the behavior
                |  states . events . a11y   |    framework-free, no DOM
                +-------------+-------------+
                              |
               connect() -> logical bindings
               (onPress, role, data-state, ...)
                              |
             +----------------+----------------+
             |                                 |
             v                                 |
 +------------------------+                    |
 | dom/components/<name>  |   the DOM half     |
 |  document listeners,   |   shared by every  |
 |  focus/stack sequence  |   DOM host         |
 +-----+------------+-----+                    |
       |            ^                          |
       |            |  dom/utils/*             |
       |            |  focus-trap, overlay,    |
       |            |  scroll-lock, ...        |
       v                                       v
 +-----------+  +-----------+           +-----------+
 |   react   |  |   solid   |           |  native   |
 +-----------+  +-----------+           +-----------+
             render + host lifecycle only
```

The engine that runs the core machines lives in its own repo:
[dunky-dev/state-machine](https://github.com/dunky-dev/state-machine). Here it
is just a dependency — this repo defines _what_ each primitive does and how it
renders, not how machines execute.

## Layout

`packages/` is a grid: one directory per layer, one package per primitive.

- **`core/`** — the behavior. One package per primitive: a framework-free
  state machine. No DOM, no framework. Published as `@dunky.dev/<name>`.
- **`dom/utils/`** — framework-free DOM utilities shared across primitives
  and substrates (focus trap, scroll lock, overlay stacking). Published as
  `@dunky.dev/dom-<name>`.
- **`dom/components/`** — the framework-free DOM half of one primitive:
  logic that is DOM-specific but not framework-specific (document listeners,
  ordered focus sequences), written once and shared by every DOM host.
  Published as `@dunky.dev/dom-<name>`.
- **`<substrate>/`** — the render. A thin binding per host (`react/`,
  `solid/`, `native/`) that wires the machine to real elements. Published as
  `@dunky.dev/<substrate>-<name>` (e.g. `@dunky.dev/react-dialog`).

The dependency direction is one-way: `substrate -> dom -> core`. A binding
adds no behavior of its own — if a decision is needed, it moves into the core
machine so every substrate inherits it. The deep reference is
[ARCHITECTURE.md](./ARCHITECTURE.md).

The native scripts need a device toolchain (Xcode / Android SDK) and a
one-time dev build — see [packages/native/README.md](./packages/native/README.md).

## License

[MIT](./LICENSE)
