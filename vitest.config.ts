import { defineConfig } from 'vitest/config'

// One project per JSX flavor: the Solid and Vue tests need their framework's
// JSX transform, which must not rewrite the React `.tsx` tests. Each lives
// with its substrate (packages/<substrate>/vitest.config.ts).
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
            'packages/vue/**',
            '**/.worktrees/**',
            '**/.claude/**',
          ],
        },
      },
      './packages/solid/vitest.config.ts',
      './packages/vue/vitest.config.ts',
    ],
  },
})
