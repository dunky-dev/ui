# dunky-dev template repo

A pnpm-workspace monorepo starter with the shared dunky-dev tooling baked in.
Use it as a GitHub **template repository** (_Use this template_) or copy it with
`npx degit dunky-dev/template-repo my-new-repo`.

## What's included

| Tool            | File                            | Purpose                                                                                  |
| --------------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| **oxlint**      | `.oxlintrc.json`                | Linting (eslint/import/react/unicorn/vitest plugins).                                    |
| **oxfmt**       | `.oxfmtrc.json`                 | Formatting — house style: no semicolons, single quotes, width 100, kebab-case filenames. |
| **lint-staged** | `.lintstagedrc.json`            | Runs `oxlint --fix` + `oxfmt` on staged `*.{ts,tsx}`.                                    |
| **husky**       | `.husky/pre-commit`             | Runs lint-staged before each commit. Installed via the `prepare` script.                 |
| **knip**        | `knip.config.ts`                | Unused-export/dependency detection (minimal config — extend per package).                |
| **TypeScript**  | `tsconfig.json`                 | Strict, ESM, bundler resolution. One `@dunky-dev/core` path alias.                       |
| **Vitest**      | `vitest.config.ts`              | Node test environment.                                                                   |
| **pnpm**        | `.npmrc`, `pnpm-workspace.yaml` | Workspace tuning; packages live under `packages/**`.                                     |
| **CI**          | `.github/workflows/ci.yml`      | Lint + typecheck + test on push/PR (Node 24, pnpm 10.20.0).                              |

## License

[MIT](./LICENSE)
