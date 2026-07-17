# Agents

The working contract for anyone — human or agent — modifying code in this
repo. This file is the canonical entry point: read it first, every time.

<!-- One paragraph on what this repo is: the problem it solves, what it
ships, and the major moving parts. Delete this comment once filled. -->

## Preflight

Before touching any code, read these in order:

1. `AGENTS.md` (this file) — rules, boundaries, the flow.
2. `README.md` — what this repo is and where things are.
3. `ARCHITECTURE.md` — the deep reference: stack, structure, testing, releases.

If a nested `AGENTS.md` exists next to a `package.json`, read it before
editing files in that scope — it overrides anything here for that scope
(see [Agents](#agents-1)).

## Scopes

| Scope      | Path                      | What it is                                               |
| ---------- | ------------------------- | -------------------------------------------------------- |
| Core       | `packages/core/**`        | Framework-free state machines, one package per primitive |
| DOM        | `packages/dom/**`         | Framework-free DOM utilities, one package per util       |
| Shared     | `packages/shared/**`      | Pure, host-free utilities, one package per util          |
| Substrates | `packages/<substrate>/**` | Thin host bindings (e.g. `packages/react`)               |

Some changes are cross-scope. Check what else your change touches before
calling it done.

## Boundaries

These are invariants, not preferences. Violating them breaks the
architecture:

- **Dependency direction is one-way.** A substrate package imports its core
  counterpart, `@dunky.dev/state-machine`, its own substrate's hooks, and the
  DOM/shared utils — nothing else from this repo. A core package imports only
  `@dunky.dev/state-machine`. A DOM or shared util imports nothing from this
  repo; a substrate hook imports only the DOM util it wraps.
- **Primitives are independent.** No cross-imports between primitives. If two
  need to share logic, that's a design decision — a new package — never a
  cross-import.
- **The machine never sees props.** Config is seeded into context at build
  time; live callbacks flow through the connector, not into the machine.
- **Reactions, not direct calls.** The machine never calls a consumer
  callback directly. The connect declares reactions (selector -> callback);
  the connector fires them on value change, in registration order — that
  order is the callback-order contract. An event that doesn't move the
  machine emits through a mailbox: an action writes a fresh token into a
  context slot for the reaction to select.
- **A binding adds no behavior.** No guards, ordering, or state of its own —
  if a substrate needs a decision made, the decision moves into the core
  machine so every other substrate inherits it.
- **Don't re-test the runtime.** `@dunky.dev/state-machine` owns transition
  execution and reaction firing; a primitive's tests cover its own state
  graph, guards, and callback contract — not the runtime's mechanics.

## Workflow

`SPEC -> TEST -> IMPLEMENT -> RECONCILE`

Keep an eye on what's been done and what's going on so you don't make a
mess: know the state before you change it, and check your work still
fits after.

### SPEC

Describes the package's intent: the problem it solves, its expected
behavior, and the constraints and edge cases that define its scope. The
spec is a description of intent, not a checklist — the reconcile step
verifies the implementation against it, so state what the package is
meant to do rather than enumerating fields. Capture what carries design
and API meaning: the consumer-facing API, the behavior contract, and any
UX or reference material that anchors it. Its home is the package's
`SPEC.md`.

If the package has no `SPEC.md` yet, ask before creating one — don't
add it unprompted.

A design decision lives in one `SPEC.md` — the package it's about.
Don't copy it into every package it touches. When a decision affects
others, just check their specs don't now contradict it; only edit
another package's `SPEC.md` if it genuinely conflicts (and prefer a
short cross-reference over restating the decision).

### TEST

Write behavior tests first. Tests are the executable spec: they capture
what the code is meant to do before the code exists.

### IMPLEMENT

Write the code that faithfully realizes the SPEC and the behavior the
TEST phase captures, within the boundaries and the architecture. The
implementation must cover the intent, not merely satisfy the assertions.
Match the existing code patterns rather than inventing structure
whenever possible, otherwise open it up for discussion.

### RECONCILE

Check whether the SPEC still describes the code: loop back or ship it.
Before shipping: tests, lint, and type-check pass, and the change is
verified across all scopes. If something's off, loop back to SPEC or
TEST; if not, ship it!

## Code

### Naming

Descriptive names everywhere. Short names are fine for local variables
with a tight, obvious scope.

### Comments

If the code says what it does, the comment is noise. Write comments to
explain _why_: a hidden constraint, a subtle invariant, a workaround, a
hard decision. Keep them short — over-explaining is its own kind of
noise. Don't restate what the code does or repeat a rule already stated
in [`ARCHITECTURE.md`](./ARCHITECTURE.md) — that's implicit and redundant.

### Performance

Performance is a constraint, not a feature. Prefer mutation over
allocation on hot paths. Avoid spreading objects, chaining array
methods, or allocating closures inside loops.

### Testing

Unit tests cover behavior and logic only — test what the code does, not
how it's structured.

No overlapping tests — each test covers one distinct behavior. Do not
write a test that is already an implicit consequence of another test
passing. Shared setup goes at the top of the file: if multiple tests
need the same config or helper, define it once at the top, not inside
each `it()`. Reusable multi-file fixtures go in `tests/fixtures/` —
anything shared across test files lives there, not inlined or
duplicated.

## Versioning

Every PR with a user-visible change to a public package needs a
changeset in `.changeset/`, describing the change from a consumer's
perspective — the feature or decision, not the code change. Add a code
snippet when the API surface changed or the usage is non-obvious, and
include context for non-obvious decisions — why the change was made,
not just what it does.

| Bump      | When                                          |
| --------- | --------------------------------------------- |
| **Major** | Breaking changes; stable milestone (1.0.0)    |
| **Minor** | New backward-compatible feature               |
| **Patch** | Bug fix, dependency update, cleanup, refactor |

## Agents

If a package needs rules of its own (different stack, platform
constraints), add an `AGENTS.md` next to its `package.json`. Resolution
is nearest-wins: an `AGENTS.md` inside the directory you're editing —
or any ancestor up to the repo root — overrides everything above it for
that directory's code. Read every `AGENTS.md` between the repo root and
the file you're editing, apply them top-down, and let the closest one
settle conflicts.

Keep nested files small — encode only what genuinely differs from this
file. A nested file that would just restate the root should be deleted.

## Diagrams in docs

Draw ASCII diagrams (boxes, trees, flows) with plain `|`, `-`, and `+`
only — never Unicode box-drawing characters (`┌ ┐ └ ┘ ─ │ ├ ┼ ▼` …).
Use `|` for verticals, `-` for horizontals, `+` for every corner and
junction, and a plain `v` / `^` / `>` / `<` for arrowheads. The
box-drawing glyphs render inconsistently across fonts, terminals, and
GitHub, and are awkward to edit; the ASCII set is portable and diffs
cleanly. This applies to every `.md` in the repo.
