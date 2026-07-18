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
|     +- focus-trap/      @dunky.dev/dom-focus-trap
|     +- scroll-lock/     @dunky.dev/dom-scroll-lock
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

The state-machine layer is external, published from its own repo: the runtime
(`@dunky.dev/state-machine`), the agnostic binding vocabulary
(`@dunky.dev/state-machine-bindings` — `EventBindings`/`AttrBindings`), and one
adapter per substrate (`@dunky.dev/react-state-machine` — `useMachine`,
`normalize`, `mergeProps`). Core composes its part bindings from the
vocabulary; each substrate drives the machine and translates bindings through
its adapter, so that plumbing is never re-implemented here.

DOM logic that several primitives or substrates need — focus containment,
scroll locking — lives once as a framework-free util under `dom/utils/`; each
substrate wraps what needs a lifecycle in a thin hook under its own `hooks/`
folder. A new substrate reuses all of it and only writes the wrappers.

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

- A substrate package imports its core counterpart, its substrate's
  state-machine adapter, its own hooks, and the DOM utils — nothing else from
  this repo.
- A core package imports only the state-machine runtime and the agnostic
  bindings vocabulary.
- A DOM util imports nothing from this repo; a substrate hook imports only the
  DOM util it wraps.
- Primitives are independent of each other. If two need to share logic, that
  sharing is a design decision (a new package), never a cross-import.

## Inside a primitive

The core package is the source of truth for behavior. The machine itself is
managed by `@dunky.dev/state-machine` — the core package defines the state
graph and the connect surface; the runtime owns state storage, transition
execution, and reactions:

```
packages/core/<name>/                 @dunky.dev/<name>
  SPEC.md            the behavior contract (see Specs)
  src/
    index.ts         barrel: the headless public surface
    types.ts         states, context, events, options/callbacks (+ ids when
                     parts cross-reference each other in ARIA)
    machine.ts       create<Name>Config(options) -> the state graph; option
                     defaults are resolved here and seeded into context
    connect.ts       machine snapshot -> one entry of logical bindings per
                     part of the anatomy, plus the callback reactions
  tests/
    machine.test.ts  transitions, gating, bindings, reactions
```

The connect's bindings are drawn from the shared agnostic vocabulary
(`EventBindings & AttrBindings` — `expanded`, `controls`, `onPress`, ...): the
core decides WHAT each part carries, every substrate's `normalize` decides HOW
that renders on its host.

Two idioms every core package follows (documented in depth per package):

- **Reactions, not direct calls.** The machine never calls a consumer
  callback. `connect.ts` declares reactions — a selector over the machine
  paired with a callback — and the connector fires the callback when the
  selected value changes, in registration order; that order is the
  callback-order contract. A callback derivable from state selects it
  (`m => m.matches('open')`); an event that doesn't move the machine emits
  through a mailbox: an action writes a fresh token into a context slot for
  the reaction to select.
- **The machine never sees props.** Config is seeded into context at build
  time; live callbacks flow through the connector.

A substrate package is a compound component in the host's native shape
(react shown):

```
packages/<substrate>/<name>/          @dunky.dev/<substrate>-<name>
  SPEC.md            substrate surface; defers behavior to the core SPEC
  src/
    index.ts         barrel: the compound component + prop types
    context.ts       compound context: the root provides { api, machine }
    use-<name>.ts    the machine owner: wraps the adapter's useMachine
                     (create once, option re-sync, effects), mints ids
    effects.ts       ComponentEffects: prop-driven / document-level work
    <name>.tsx       root + parts: wires behavior onto host elements, via
                     the adapter's normalize + mergeProps
  tests/
    <name>.test.tsx  substrate behavior through the host (render + interact)
  stories/
    <name>.stories.tsx  the dev-harness showcase (`pnpm dev`); the story is
                     the consumer, so it brings the styles
```

**Render wiring.** `<name>.tsx` assembles the compound component — the root
and one part per piece of the anatomy. Three patterns to follow.

The **root** builds the machine and shares it. It renders no DOM of its own:
it calls the owner hook, which returns the connected `api` and the running
`service`, and hands both to a context that every part reads:

```tsx
export const Component: ((props: ComponentProps) => ReactNode) & Parts = ({
  children,
  ...options
}) => {
  const value = useComponent(options)
  return <ComponentContext.Provider value={value}>{children}</ComponentContext.Provider>
}
```

A **part** wires behavior onto its element and does nothing else. It reads
the context, layers the consumer's props over the part's translated logical
bindings, and spreads the result onto its element:

```tsx
export const Trigger: PartComponent<TriggerProps, HTMLButtonElement> = forwardRef((props, ref) => {
  const { api } = useComponentContext()
  const merged = mergeProps(props, toDomProps(api.parts.trigger))
  return <button {...merged} ref={ref} />
})
```

Finally, **hang the parts off the root** as statics, typed by a `Parts`
interface, so consumers reach them as `<Component.Trigger>`:

```tsx
export interface Parts {
  Trigger: typeof Trigger
  // ...one entry per part
}

Component.Trigger = Trigger
```

There is no styles layer — the repo ships headless. A part renders its
natural element; the `data-state` attribute carried by every part's bindings
is the consumer's styling and animation hook.

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
