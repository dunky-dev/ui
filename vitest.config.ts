import { defineConfig } from 'vitest/config'

// Two projects: the Solid tests need vite-plugin-solid's JSX transform, which
// must not rewrite the React `.tsx` tests. The solid project lives with its
// substrate (packages/solid/vitest.config.ts).
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
            '**/.worktrees/**',
            '**/.claude/**',
          ],
        },
      },
      './packages/solid/vitest.config.ts',
    ],
  },
})
