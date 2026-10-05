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
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**/*.ssr.test.ts'],
  },
})
