# Scaffolding templates

`pnpm scaffold <kind> <name>` copies `scripts/templates/<kind>/` into the repo,
substituting the primitive's name, then derives the workspace wiring (tsconfig
`paths` + tsdown `workspace`) from the packages it created. See
[`../scaffold.ts`](../scaffold.ts).

```
pnpm scaffold full toggle          # single word
pnpm scaffold full toggle-button   # multi-word (kebab-case)
```

## Tokens

Template files (and file/dir names) are real, tokenized source. Three tokens are
substituted from the kebab-case name argument:

| Token            | Becomes                | Example (`toggle-button`) |
| ---------------- | ---------------------- | ------------------------- |
| `__name__`       | the name, kebab-case   | `toggle-button`           |
| `__Name__`       | PascalCase             | `ToggleButton`            |
| `__camelName__`  | camelCase              | `toggleButton`            |

Only `__name__` appears in file and directory names (e.g.
`src/create-__name__.ts`).

## Adding a kind

A "kind" is a folder under `scripts/templates/`. Its contents mirror the repo
root, so a package at `<kind>/packages/native/__name__/` lands at
`packages/native/__name__/`. To add one (say, a native driver group):

1. Create `scripts/templates/<kind>/packages/.../__name__/` with a
   tokenized `package.json`, `src/`, `tests/`, `README.md`, and `SPECS.md`.
2. That's it — the script discovers the created packages from the copied
   `package.json` files and wires them automatically. A package with
   `"private": true` is added to tsconfig `paths` but skipped in the tsdown
   publish set.

## Why this dir is tool-excluded

`scripts/templates/**` is excluded from oxfmt, oxlint, vitest, and knip (see the
root configs): the `__name__` token collides with Markdown bold (`__`), the
underscore filenames fail the kebab-case lint rule, and the `.test.ts` stubs
only resolve once scaffolded. The generated output lands under `packages/`,
where every check applies in full — and the scaffold formats it on the way out.
