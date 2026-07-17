import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Many package exports are public API (re-exported from each package's index)
  // that knip can't see a consumer for in this repo, but which are used within
  // their own module — keep those out of the "unused exports" report.
  ignoreExportsUsedInFile: true,

  // Scaffolding template stubs — not part of the dependency graph until copied
  // out by scripts/scaffold.ts.
  ignore: ['scripts/templates/**'],

  // Stories are entries: Storybook loads them via the glob in
  // packages/<substrate>/.storybook/main.ts; nothing imports them. Without
  // this, knip reports every story file as unused. One line per substrate.
  workspaces: {
    'packages/react/*': {
      entry: ['stories/*.stories.tsx'],
    },
  },
}

export default config
