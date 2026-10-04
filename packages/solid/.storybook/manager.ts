import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

addons.setConfig({
  showToolbar: true,
  layoutCustomisations: {
    showPanel: () => false,
  },
  theme: create({
    base: 'light',
    brandTitle: 'dunky',
    brandUrl: './',
  }),
})
