import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    // scripts/templates holds __name__-tokenized scaffolding stubs — real files,
    // but not runnable tests (their imports resolve only once scaffolded).
    // .worktrees holds local worktree checkouts; lint ignores it, vitest must too.
    exclude: ['**/node_modules/**', '**/dist/**', 'scripts/templates/**', '**/.worktrees/**'],
  },
})
