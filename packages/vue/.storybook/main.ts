import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/vue3-vite',
    // Docgen reads `.vue` files; the parts are `.ts` components.
    options: { docgen: false },
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: {
    sidebarOnboardingChecklist: false,
  },
  viteFinal: viteConfig =>
    mergeConfig(viteConfig, {
      // A linked state-machine adapter (cross-repo development) resolves
      // `vue` from its own checkout; two copies split the component instance,
      // so every import is pinned to this workspace's.
      resolve: { dedupe: ['vue'] },
      // Vue's esm-bundler build takes its feature flags from the bundler
      // (@vitejs/plugin-vue defines them; this framework adds no such plugin)
      // and logs a notice on every load without them. The binding, its
      // adapter, the stories, and Storybook's renderer use setup() and render
      // functions only, so the Options API stays out — which also shows the
      // dialog working in an app that turns it off. A static Storybook has no
      // production devtools and no hydration.
      define: {
        __VUE_OPTIONS_API__: 'false',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      },
    }),
}

export default config
