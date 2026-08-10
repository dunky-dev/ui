// Native tests run on jest-expo, not the repo's vitest — real react-native
// ships untranspiled Flow that vitest can't parse, and jest-expo carries the
// battle-tested RN + Expo transform allowlist. One config for every native
// primitive's tests under this substrate.
const expoPreset = require('jest-expo/jest-preset')

// jest-expo allowlists the pnpm store for transform, but a pnpm path nests a
// second `/node_modules/@dunky.dev/...` that its lookahead re-ignores — so the
// @dunky.dev source (ESM/TS) reaches jest untransformed. Add the scope to the
// allowlist.
const transformIgnorePatterns = expoPreset.transformIgnorePatterns.map(pattern =>
  pattern.replace('/node_modules/(?!(.pnpm|', '/node_modules/(?!(.pnpm|@dunky\\.dev|'),
)

module.exports = {
  ...expoPreset,
  rootDir: '.',
  testMatch: ['<rootDir>/*/tests/**/*.test.@(ts|tsx)'],
  // Establish React 19's act environment for the whole run (appended to
  // jest-expo's own setup, not replacing it).
  setupFiles: [...(expoPreset.setupFiles ?? []), '<rootDir>/jest-setup.cjs'],
  transformIgnorePatterns,
  // The @dunky.dev packages ship ESM-only exports; this resolver lets the
  // CommonJS jest resolve their `import` condition (wraps jest-expo's own).
  resolver: '<rootDir>/jest-resolver.cjs',
}
