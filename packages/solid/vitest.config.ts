import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

// Referenced as a project from the root vitest.config.ts; lives here so the
// root workspace carries no Solid dependencies. vite-plugin-solid force-injects
// `@testing-library/jest-dom/vitest` as a setup file whenever the package is
// resolvable (storybook ships it as a real dependency, so it always is here) —
// the harness devDep makes that injected bare specifier resolvable for vitest.
export default defineConfig({
  plugins: [solid()],
  resolve: {
    // @solidjs/testing-library + the reactive runtime expect these conditions.
    conditions: ['development', 'browser'],
  },
  test: {
    name: 'solid',
    globals: false,
    // node by default; DOM tests opt into jsdom per-file via `@vitest-environment`.
    environment: 'node',
    include: ['**/tests/**/*.test.{ts,tsx}'],
  },
})
