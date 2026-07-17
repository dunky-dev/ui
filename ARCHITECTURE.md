# Architecture

One behavior, many hosts. Every primitive is modeled once as a framework-free
state machine — its **core** package — and delivered through thin bindings,
one per host environment — the **substrates**. Behavior cannot drift between
hosts because it exists in exactly one place.

A substrate is any environment a primitive is delivered to: a framework
(react), another framework (vue, solid), or a different host entirely
(native). Substrates are cheap by design; the expensive thing — the behavior
— is written once.

## Layout

`packages/` is a grid: one directory per layer, one package per primitive
inside it.

```
packages/
|
+- core/                  substrate-free behavior, one package per primitive
|  +- dialog/             @dunky.dev/dialog
|  +- tooltip/            @dunky.dev/tooltip
|  +- ...
|
+- dom/
|  +- utils/              framework-free DOM utilities, one package per util
|     +- focus-trap/      @dunky.dev/focus-trap
|     +- scroll-lock/     @dunky.dev/scroll-lock
|     +- ...
|
+- <substrate>/           any future host, same shape
   +- hooks/              thin substrate wrappers over the DOM utils
   |  +- use-focus-trap/  @dunky.dev/<substrate>-use-focus-trap
   |  +- ...
   +- dialog/             @dunky.dev/<substrate>-dialog
   +- tooltip/            @dunky.dev/<substrate>-tooltip
   +- ...
```

So a primitive is one package in `core` plus one in each substrate:
`@dunky.dev/<name>` and `@dunky.dev/<substrate>-<name>`.

DOM logic that several primitives or substrates need — focus containment,
scroll locking — lives once as a framework-free util under `dom/utils/`;
each substrate wraps it in a thin hook under its own `hooks/` folder. A new
substrate reuses the utils and only writes the wrappers.

Each substrate directory is itself a private workspace package
(`@dunky-dev/<substrate>`) that owns the substrate's infrastructure — the dev
harness, framework deps, dev/build scripts. The publishable packages live one
level down. Internal infra uses the `@dunky-dev` scope; published packages use
`@dunky.dev`.

## Layers and dependency direction

```
+-----------------------------------------------------------+
|  machine runtime           @dunky.dev/state-machine        |
|                            (external dependency)           |
+-----------------------------------------------------------+
       |
       v
+-----------------------------------------------------------+
|  core primitive            packages/core/<name>            |
|                            @dunky.dev/<name>               |
|                                                            |
|  the behavior: states, transitions, guards, callback       |
|  ordering — no DOM, no framework, no host assumptions      |
+-----------------------------------------------------------+
       |
       v
+-----------------------------------------------------------+
|  substrate binding         packages/<substrate>/<name>     |
|                            @dunky.dev/<substrate>-<name>   |
|                                                            |
|  owns the host wiring: element/listener lifecycle,         |
|  translating host events into machine events, re-syncing   |
|  options each render so fresh callbacks land               |
+-----------------------------------------------------------+
       |
       v
  consumer code
```

The rules, stated as imports:

- A substrate package imports its core counterpart, the machine runtime, and
  its own substrate's hooks — nothing else from this repo.
- A core package imports only the machine runtime.
- A DOM util imports nothing from this repo; a substrate hook imports only
  the DOM util it wraps.
- Primitives are independent of each other. If two need to share logic, that
  sharing is a design decision (a new package), never a cross-import.

## Inside a primitive

The core package is the source of truth for behavior. The machine itself is
managed by `@dunky.dev/state-machine` — the core package defines the state
graph and the connect surface; the runtime owns state storage, transition
execution, and reactions:

```
packages/core/<name>/
  SPEC.md          the behavior contract (see Specs)
  src/             the source code of the package
  tests/           drive the machine with raw events; assert callbacks
```

Two idioms every core package follows (documented in depth per package):

- **Emission mailboxes.** The machine never calls consumer callbacks. An
  action writes a fresh token into a context slot; a connector reaction fires
  the callback on the reference change. Reaction registration order is the
  callback-order contract.
- **The machine never sees props.** Config is seeded into context at build
  time; live callbacks flow through the connector.

A substrate package is a binding in the host's native shape:

```
packages/<substrate>/<name>/
  SPEC.md          host-facing surface; defers behavior to the core SPEC
  src/             the binding
  tests/           exercise through the host (e.g. render + click)
```

In react that shape is a hook: `use<Name>()` creates the machine once,
attaches/detaches via a ref callback (restart-safe for StrictMode), and
re-syncs options after every render.

A binding adds no behavior — no guards, no ordering, no state of its own. If
a substrate needs a decision made, the decision moves into the core machine
where every other substrate inherits it.

## Specs

`SPEC.md` in the core package is the behavior contract: reference, overview,
anatomy, behavior, states, accessibility, constraints, design. Substrate SPECs
document only their own surface (install, usage, API) and link back to the
core spec.

Work in that order: spec, then tests, then implementation.

## Scaffolding

`pnpm scaffold <name>` stamps a primitive across every substrate from
`scripts/templates/packages/` and wires the workspace (tsconfig `paths`,
tsdown `workspace`). Adding a substrate to the scaffold is dropping a
directory into the templates — the script discovers it. See
[`scripts/templates/README.md`](./scripts/templates/README.md).

## Who owns what

- The root owns building (tsdown workspace), testing (vitest), lint/format
  (oxlint/oxfmt), and releases (changesets) — one config each, no per-package
  tooling.
- Each substrate owns its dev harness and framework deps — e.g.
  `packages/react/.storybook`, run with `pnpm dev [substrate]`.
- Publishable packages are listed explicitly in `tsdown.config.ts`; a private
  package gets a tsconfig path but is never published.

`packages/core` currently also holds a placeholder package
(`@dunky-dev/core`) that keeps the build/test pipeline green; the first real
primitive replaces it.
