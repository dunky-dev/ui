# Contributing

For the contribution _workflow_, code conventions, and boundaries, see [`AGENTS.md`](./AGENTS.md) — it's the same
contract agents follow here, and it applies to you too.

## Setup

```bash
git clone git@github.com:dunky-dev/ui.git
cd ui
nvm use
corepack enable
pnpm install
```

## Commands

| Command                        | What it does                                               |
| ------------------------------ | ---------------------------------------------------------- |
| `pnpm scaffold <name>`         | Stamps a new primitive across every substrate              |
| `pnpm test`                    | Full test suite, watch mode                                |
| `pnpm typecheck`               | `tsc --noEmit` across the whole workspace                  |
| `pnpm lint`                    | `oxlint`                                                   |
| `pnpm format` / `format:check` | `oxfmt`                                                    |
| `pnpm knip`                    | Unused exports/dependencies                                |
| `pnpm changeset`               | Add a changeset — see [Versioning](./AGENTS.md#versioning) |

Target one package or one file instead of the whole workspace:

```bash
pnpm --filter @dunky-dev/core test
pnpm test packages/core/src/some-file.test.ts
```

## Storybook

Each UI substrate (React, Vue, ...) is a self-contained package under
`packages/<substrate>` with its own Storybook — the fastest way to see a
change actually render. `pnpm dev` delegates to the substrate's package via
`scripts/sb.js`:

```bash
pnpm dev             # @dunky-dev/react Storybook, defaults to http://localhost:6006
pnpm dev vue         # once packages/vue exists
pnpm build-storybook # static build of the react substrate's Storybook
```

## Filing an issue

A bug report is only as useful as its reproduction. Use an **SSCCE** — Short,
Self-Contained, Correct (Compilable) Example:

- **Short** — the smallest snippet that still reproduces it. Strip every
  prop, wrapper, and state change that isn't load-bearing.
- **Self-contained** — no missing imports, no "assume you have X set up."
  Someone should be able to paste it and run it with nothing else.
- **Correct (compilable)** — it actually runs and actually reproduces the
  bug. Not what you _think_ is happening — what you pasted and ran.

The [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) asks for
exactly this. If you can't shrink your repro to an SSCCE, that's often a sign
the bug isn't where you think it is — shrinking it is frequently how you find
the real cause yourself.

## Pull requests

### Humans

When using AI to help write changes, read the diff like you wrote it yourself
before asking someone else to. Cut comments that don't say anything, drop
anything that drifted from what you're actually fixing, and be able to
explain any line if asked. A reviewer's time isn't free.

### AI

Before opening it, make sure tests, lint, and typecheck pass, and a changeset is
included — see `AGENTS.md`'s Workflow section.
