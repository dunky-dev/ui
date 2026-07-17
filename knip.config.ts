import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Many package exports are public API (re-exported from each package's index)
  // that knip can't see a consumer for in this repo, but which are used within
  // their own module — keep those out of the "unused exports" report.
  ignoreExportsUsedInFile: true,

  // Scaffolding template stubs — not part of the dependency graph until copied
  // out by scripts/scaffold.ts.
  ignore: ['scripts/templates/**'],

  // Stories are entries: loaded by the substrate's Storybook (the glob in
  // packages/<substrate>/.storybook/main.ts), not imported by any module.
  // One line per substrate — extend when the next substrate lands.
  workspaces: {
    'packages/react/*': {
      entry: ['stories/*.stories.tsx'],
    },
  },

  // Add per-package overrides here as the workspace grows, e.g. a package that
  // re-exports another's surface without importing it directly:
  //   workspaces: { 'packages/native/press': { ignoreDependencies: ['@dunky.dev/press'] } }
}

export default config
