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
    // knip's storybook plugin doesn't know the community solid framework;
    // jest-dom is loaded via a setup file vite-plugin-solid injects.
    'packages/solid': {
      entry: ['.storybook/main.ts', '.storybook/manager.ts'],
      ignoreDependencies: ['@testing-library/jest-dom'],
    },
    'packages/solid/*': {
      entry: ['stories/*.stories.tsx'],
      // The babel presets are referenced as strings in tsdown.config.ts.
      ignoreDependencies: ['babel-preset-solid', '@babel/preset-typescript'],
    },
    'packages/native': {
      // The Expo shell: `userInterfaceStyle` is honored from the manifest on
      // iOS; the Android half would need the expo-system-ui native module,
      // which a stories harness has no use for. `@expo/vector-icons` is a
      // moduleNameMapper target inside jest-expo's own preset, not ours.
      ignoreDependencies: ['expo-system-ui', '@expo/vector-icons'],
      // babel-preset-expo ships inside `expo`; babel-jest is jest-expo's
      // transform, resolved from the preset. Neither is ours to list.
      ignoreUnresolved: ['babel-preset-expo', 'babel-jest'],
    },
    // The on-device Storybook reaches the stories through the generated,
    // gitignored storybook.requires.ts (see .rnstorybook/index.ts).
    'packages/native/*': {
      entry: ['stories/*.stories.tsx'],
    },
  },
}

export default config
