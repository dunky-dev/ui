import type { StorybookConfig } from '@storybook/react-native'

// On-device Storybook: renders the stories on a real simulator/device.
// Single-level `*/stories/` (not `**`) so the recursive require.context
// doesn't crawl node_modules and pull in @storybook/react-native's own
// template example stories (Button/Header/Page).
const main: StorybookConfig = {
  stories: ['../*/stories/*.stories.@(ts|tsx)'],
  addons: [],
}

export default main
