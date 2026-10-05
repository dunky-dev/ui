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
  // A linked state-machine adapter (cross-repo development) resolves `vue`
  // from its own checkout; two copies split the component instance, so every
  // import is pinned to this workspace's.
  viteFinal: viteConfig => mergeConfig(viteConfig, { resolve: { dedupe: ['vue'] } }),
}

export default config
