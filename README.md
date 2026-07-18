<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/dunky-dev/logo/main/logo-white%402x.png" />
    <img src="https://raw.githubusercontent.com/dunky-dev/logo/main/logo%402x.png" alt="Dunky" width="400px" />
  </picture>
</p>

# UI

**The components (powered by [Dunky's state-machine](https://github.com/dunky-dev/state-machine))**

Dunky splits a UI component into two things: _behavior_ and _render_. The
state-machine repo is the engine — it models behavior as a plain, framework-free
state machine. **This repo is the other half: the UI.** It's where the components
live, and everything needed to render them — each primitive's behavior, the DOM
utilities they share, and the thin per-substrate bindings that turn a machine into
something you can put on screen.

Every primitive is modeled once as a framework-free
machine (its **core**) and delivered through a thin binding per host environment.

```
              @dunky.dev/state-machine         the engine + bindings
                         |
                         v
         +-------------------------------+
         |         core primitive        |      packages/core/<name>
         |     states . events . a11y    |      pure behavior — no DOM, no framework
         +---------------+---------------+
                         |
                         |  connect() -> logical bindings
                         |  (onPress, role, labelledBy, data-state, ...)
                         |
          +--------------+--------------+
          v              v              v
    +-----------+  +-----------+  +-----------+
    | substrate |  | substrate |  | substrate |  packages/<substrate>/<name>
    |  (react)  |  |   (vue)   |  |  (native) |  render + host wiring
    +-----------+  +-----------+  +-----------+
         same behavior, same a11y — only the render differs
```

## Layout

`packages/` is a grid: one directory per layer, one package per primitive.

- **`core/`** — the behavior. One package per primitive: a framework-free state
  machine built on `@dunky.dev/state-machine`. No DOM, no framework. Published
  as `@dunky.dev/<name>`.
- **`dom/`** — framework-free DOM utilities shared across primitives and
  substrates (focus trap, scroll lock, the bindings translation). Published as
  `@dunky.dev/dom-<name>`.
- **`<substrate>/`** — the render. A thin binding per host that wires the machine
  to real elements. Published as `@dunky.dev/<substrate>-<name>` (e.g.
  `@dunky.dev/react-dialog`).

The dependency direction is one-way: `substrate -> core -> engine`. A binding
adds no behavior of its own — if a decision is needed, it moves into the core
machine so every substrate inherits it. The deep reference is
[ARCHITECTURE.md](./ARCHITECTURE.md).

## License

[MIT](./LICENSE)
