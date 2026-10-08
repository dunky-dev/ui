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
    // A rune module loaded straight from node_modules would run uncompiled;
    // vite-plugin-svelte only inlines the Svelte packages the harness itself
    // depends on, and the adapter is a dependency of the packages below it.
    server: { deps: { inline: ['@dunky.dev/svelte-state-machine'] } },
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
