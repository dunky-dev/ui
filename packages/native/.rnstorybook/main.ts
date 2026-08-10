import type { StorybookConfig } from '@storybook/react-native'

// On-device Storybook: renders the stories on a real simulator/device.
const main: StorybookConfig = {
  stories: ['../**/stories/*.stories.@(ts|tsx)'],
  addons: [],
}

export default main
