import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Many package exports are public API (re-exported from each package's index)
  // that knip can't see a consumer for in this repo, but which are used within
  // their own module — keep those out of the "unused exports" report.
  ignoreExportsUsedInFile: true,

  // Scaffolding template stubs — not part of the dependency graph until copied
  // out by scripts/scaffold.ts.
  ignore: ['scripts/templates/**'],

  workspaces: {
    '.': {
      // pnpm script names knip mistakes for binaries when it parses
      // `pnpm -C <dir> <script>` invocations in package.json / workflows
      // (e.g. the `pnpm -C website build` step in deploy.yml).
      ignoreBinaries: ['build'],
      // When this repo has React packages, install `react`/`@types/react` at the
      // root (so tsc/vitest can resolve them as peers) and ignore them here, since
      // knip can't attribute a root-level peer to a package import:
      // ignoreDependencies: ['react', '@types/react'],
    },
    // Add per-package overrides here as the workspace grows, e.g. a package that
    // re-exports another's surface without importing it directly:
    // 'packages/native': { ignoreDependencies: ['@dunky-dev/core'] },
  },
}

export default config
