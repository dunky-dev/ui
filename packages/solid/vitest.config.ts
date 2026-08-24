import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

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
    setupFiles: ['../../vitest.setup.ts'],
    include: ['**/tests/**/*.test.{ts,tsx}'],
  },
})
