import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// The server half: components compile for `svelte/server`, and Svelte must
// resolve to its server runtime — the client project's browser condition would
// pair server-compiled components with the client runtime.
export default defineConfig({
  plugins: [svelte({ configFile: false })],
  test: {
    name: 'svelte-ssr',
    globals: false,
    environment: 'node',
    include: ['**/tests/**/*.ssr.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
