import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // The native substrate's tests render through react-native-web in jsdom —
    // same stack as every other substrate's tests. Nothing outside
    // packages/native imports react-native, so the alias is inert elsewhere.
    alias: { 'react-native': 'react-native-web' },
  },
  test: {
    globals: false,
    environment: 'node',
    // scripts/templates holds __name__-tokenized scaffolding stubs — real files,
    // but not runnable tests (their imports resolve only once scaffolded).
    // .worktrees and .claude/worktrees hold local worktree checkouts; lint
    // ignores them, vitest must too.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'scripts/templates/**',
      '**/.worktrees/**',
      '**/.claude/**',
    ],
  },
})
