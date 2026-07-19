// Monorepo Metro config for the on-device Storybook: watch the workspace root
// so Metro picks up the linked @dunky.dev/* source packages, and resolve
// modules from both the app's and the root's node_modules. Mirrors the
// standard Expo monorepo setup.
const { getDefaultConfig } = require('expo/metro-config')
const { withStorybook } = require('@storybook/react-native/metro/withStorybook')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Force a single React instance. The workspace packages are consumed as
// source and carry their own react in devDependencies; without this Metro
// would bundle that copy (resolved via each package's node_modules)
// alongside the app's react — the one react-native renders with — giving two
// React instances and "Invalid hook call" errors. Metro doesn't dedupe, and
// extraNodeModules won't help because the wrong copy resolves normally; we
// redirect every `react`/`react/*` request to the app's copy.
const appModules = path.resolve(projectRoot, 'node_modules')
const defaultResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(appModules, 'noop.js') },
      moduleName,
      platform,
    )
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform)
}

// Wires the on-device Storybook: generates .rnstorybook/storybook.requires.ts
// from the stories glob at bundle time.
module.exports = withStorybook(config, {
  enabled: true,
  configPath: path.resolve(projectRoot, '.rnstorybook'),
})
