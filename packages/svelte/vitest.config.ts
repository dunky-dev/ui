import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig } from 'vitest/config'

// The client half: components compile for the DOM, and svelteTesting resolves
// Svelte's browser runtime and registers the per-test cleanup. Server renders
// need the opposite resolution, so they run in their own project
// (vitest.ssr.config.ts).
export default defineConfig({
  plugins: [svelte({ configFile: false }), svelteTesting()],
  test: {
    name: 'svelte',
    globals: false,
    // node by default; DOM tests opt into jsdom per-file via `@vitest-environment`.
    environment: 'node',
    include: ['**/tests/**/*.test.ts'],
    // Server markup for the hydration test, rendered outside this project's
    // browser resolution.
    globalSetup: ['./dialog/tests/fixtures/server-render.ts'],
    // A rune module loaded straight from node_modules would run uncompiled;
    // vite-plugin-svelte only inlines the Svelte packages the harness itself
    // depends on, and the adapter is a dependency of the packages below it.
    server: { deps: { inline: ['@dunky.dev/svelte-state-machine'] } },
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**/*.ssr.test.ts'],
  },
})
