import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: {
    sidebarOnboardingChecklist: false,
  },
  // Served under a subpath on GitHub Pages (e.g. /ui/), so the preview's asset
  // URLs must resolve there. The deploy workflow sets BASE_PATH; local dev and
  // builds leave it unset and stay at the root.
  viteFinal: viteConfig => {
    viteConfig.base = process.env.BASE_PATH ?? '/'
    return viteConfig
  },
}

export default config
