# Agent + contributor guide

The working contract for anyone (human or agent) modifying code in this
repo. This file is the canonical entry point — read it first, every time.

## Preflight

Before touching any code, read these in order:

1. `AGENTS.md` (this file) — rules, boundaries, workflow.
2. `README.md` — what this project is and how to run it.
3. `ARCHITECTURE.md` — the structure and where things live.

If a per-package `AGENTS.md` exists alongside a `package.json`, read it
before editing files in that package — it overrides anything here for
that scope.

## Boundaries

<!-- Encode this repo's hard invariants here — the rules that are not
preferences but must hold for the design to stay coherent (e.g. layering,
dependency direction, what may import what). Delete this comment once filled. -->

## Workflow

Before finishing any change:

- **Check affected packages.** A change in one package may need follow-up in
  others. Always check what else the change touches.
- **Follow the architecture.** Read `ARCHITECTURE.md` before making structural
  decisions. When something doesn't fit cleanly, flag it and suggest a better
  approach rather than forcing it.
- **Suggest improvements proactively.** If you notice a cleaner design, a missing
  test, or a pattern inconsistency while working, say so — don't just do the minimum.
- **Use available skills.** Before reviewing code use the `/code-review` skill.
  Check what's available.

## Diagrams in docs

Draw ASCII diagrams (boxes, trees, flows) with plain `|`, `-`, and `+`
only — never Unicode box-drawing characters (`┌ ┐ └ ┘ ─ │ ├ ┼ ▼` …).
Use `|` for verticals, `-` for horizontals, `+` for every corner and
junction, and a plain `v` / `^` / `>` / `<` for arrowheads. The
box-drawing glyphs render inconsistently across fonts, terminals, and
GitHub, and are awkward to edit; the ASCII set is portable and diffs
cleanly. This applies to every `.md` in the repo.

## Code

### Performance

- **Performance is a constraint, not a feature.** Prefer mutation over allocation on hot paths.
  Avoid spreading objects, chaining array methods, or allocating closures inside loops.
- **Descriptive names everywhere.** Short names are fine for
  local variables with a tight, obvious scope.
- **Comments.** If the code says what it does, the comment is
  noise. Write comments to explain _why_: a hidden constraint, a subtle invariant, a
  workaround, a hard decision. Keep them short, avoid over explaining to avoid noise.

### Testing

- **No overlapping tests.** Each test covers one distinct behavior. Do not write a test that
  is already an implicit consequence of another test passing.
- **Shared setup goes at the top of the file.** If multiple tests need the same setup
  or helper, define it once at the top — not inside each `it()`.
- **Reusable multi-file fixtures go in `tests/fixtures/`.** Anything shared across test files
  lives there, not inlined or duplicated.

## Versioning

Changelog entries describe the **feature or decision**, not the code change.
Add a code snippet when the API surface changed or the usage is non-obvious.
Include context for non-obvious decisions — why the change was made, not just
what it does.

| Bump      | When                                          |
| --------- | --------------------------------------------- |
| **Major** | Breaking changes; stable milestone (1.0.0)    |
| **Minor** | New backward-compatible feature               |
| **Patch** | Bug fix, dependency update, cleanup, refactor |

## Per-package guidance

If a package needs rules of its own (build quirks, platform-only
constraints), add an `AGENTS.md` next to its `package.json`. The same
convention applies further down the tree — anywhere a directory has
rules its parent doesn't capture.

Resolution is nearest-wins: an `AGENTS.md` inside the directory you
are editing (or any ancestor up to the repo root) overrides everything
above it for that directory's code. When editing a file, read every
`AGENTS.md` between the repo root and that file, apply them top-down,
and let the closest one settle conflicts.

Keep nested files small. Only encode what genuinely differs from the
ancestor — duplicating rules invites drift. If a nested file would
just restate the root, delete it.
