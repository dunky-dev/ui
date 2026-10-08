import { svelte } from '@sveltejs/vite-plugin-svelte'
import type { StorybookConfig } from '@storybook/svelte-vite'

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(ts|svelte)'],
  addons: ['@storybook/addon-svelte-csf'],
  framework: '@storybook/svelte-vite',
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: {
    sidebarOnboardingChecklist: false,
  },
  // The framework compiles nothing itself: it expects vite-plugin-svelte from
  // the project's Vite config, ahead of its docgen plugin, which reads the
  // compiled output. This harness has no Vite config, so it goes first here.
  viteFinal: viteConfig => {
    viteConfig.plugins = [svelte({ configFile: false }), ...(viteConfig.plugins ?? [])]
    return viteConfig
  },
}

export default config
