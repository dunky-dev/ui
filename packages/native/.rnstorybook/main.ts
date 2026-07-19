import type { StorybookConfig } from '@storybook/react-native'

// The same story files the web (react-native-web) Storybook renders — one
// story source, two runners.
const main: StorybookConfig = {
  stories: ['../**/stories/*.stories.@(ts|tsx)'],
  addons: [],
}

export default main
