import { defineConfig } from 'vitest/config'

// One project per compile pipeline: the Solid tests need vite-plugin-solid's
// JSX transform, which must not rewrite the React `.tsx` tests, and the Svelte
// tests need vite-plugin-svelte — twice, since a server render resolves Svelte
// to its server runtime and a DOM test to its browser one. The substrate
// projects live with their substrates (packages/<substrate>/vitest*.config.ts).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'default',
          globals: false,
          environment: 'node',
          // scripts/templates holds __name__-tokenized stubs (not runnable),
          // .worktrees/.claude hold local checkouts, packages/native runs on
          // jest-expo — see packages/native/jest.config.cjs.
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'scripts/templates/**',
            'packages/native/**',
            'packages/solid/**',
            'packages/svelte/**',
            '**/.worktrees/**',
            '**/.claude/**',
          ],
        },
      },
      './packages/solid/vitest.config.ts',
      './packages/svelte/vitest.config.ts',
      './packages/svelte/vitest.ssr.config.ts',
    ],
  },
})
