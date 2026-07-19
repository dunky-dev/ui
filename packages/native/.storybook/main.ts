import type { StorybookConfig } from '@storybook/react-native-web-vite'

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-native-web-vite',
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: {
    sidebarOnboardingChecklist: false,
  },
}

export default config
