import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The TSX tests compile through Vue's JSX transform, which must not rewrite
  // the React `.tsx` tests — hence a project of its own.
  plugins: [vueJsx()],
  resolve: {
    // A linked state-machine adapter (cross-repo development) resolves `vue`
    // from its own checkout; two copies split the component instance, so
    // every import is pinned to this workspace's.
    dedupe: ['vue'],
  },
  test: {
    name: 'vue',
    globals: false,
    // node by default; DOM tests opt into jsdom per-file via `@vitest-environment`.
    environment: 'node',
    include: ['**/tests/**/*.test.{ts,tsx}'],
  },
})
