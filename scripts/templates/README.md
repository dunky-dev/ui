# Scaffolding templates

`pnpm scaffold <name>` copies `scripts/templates/packages/` into the repo's
`packages/`, substituting the primitive's name, then derives the workspace wiring
(tsconfig `paths` + tsdown `workspace`) from the packages it created. See
[`../scaffold.ts`](../scaffold.ts).

```
pnpm scaffold tooltip        # single word
pnpm scaffold icon-button    # multi-word (kebab-case)
```

## Tokens

Template files (and file/dir names) are real, tokenized source. Three tokens are
substituted from the kebab-case name argument:

| Token            | Becomes                | Example (`icon-button`) |
| ---------------- | ---------------------- | ------------------------- |
| `__name__`       | the name, kebab-case   | `icon-button`           |
| `__Name__`       | PascalCase             | `IconButton`            |
| `__camelName__`  | camelCase              | `iconButton`            |

Only `__name__` appears in file and directory names (e.g. `src/create-__name__.ts`).

## Adding a substrate

A substrate is a folder under `scripts/templates/packages/`, mirroring
`packages/<substrate>/` in the repo — so `scripts/templates/packages/native/__name__/`
lands at `packages/native/__name__/`. To add one (say, a native driver group):

1. Create `scripts/templates/packages/<substrate>/__name__/` with a
   tokenized `package.json`, `src/`, `tests/`, `README.md`, and `SPEC.md`.
2. That's it — the script discovers the created packages from the copied
   `package.json` files and wires them automatically. A package with
   `"private": true` is added to tsconfig `paths` but skipped in the tsdown
   publish set.
