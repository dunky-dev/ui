// Wrap jest-expo's resolver (which handles RN platform extensions). The
// @dunky.dev packages publish ESM-only `exports` (an `import` condition, no
// `require`), which the CommonJS default set can't match — so add `import`
// to the conditions for those requests only. Scoped on purpose: adding it
// globally makes packages that list `import` first (e.g. @babel/runtime)
// resolve to their ESM build, which jest then can't load.
const expoPreset = require('jest-expo/jest-preset')

const expoResolver = require(expoPreset.resolver)

module.exports = (request, options) => {
  const conditions = request.startsWith('@dunky.dev/')
    ? [...(options.conditions ?? []), 'import']
    : options.conditions
  return expoResolver(request, { ...options, conditions })
}
