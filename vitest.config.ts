import { defineConfig } from 'vitest/config'

// Two projects so the Solid tests get their JSX transform without touching the
// rest of the suite. The default project runs every package the way it always
// has (node, or jsdom via a per-file `@vitest-environment` comment) and
// EXCLUDES the Solid tests; the `solid` project lives with its substrate
// (packages/solid/vitest.config.ts) so the root carries no Solid dependencies.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'default',
          globals: false,
          environment: 'node',
          // scripts/templates holds __name__-tokenized scaffolding stubs — real
          // files, but not runnable tests (their imports resolve only once
          // scaffolded). .worktrees and .claude/worktrees hold local worktree
          // checkouts; lint ignores them, vitest must too. packages/native runs
          // on jest-expo (real react-native), not vitest — see
          // packages/native/jest.config.cjs.
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
