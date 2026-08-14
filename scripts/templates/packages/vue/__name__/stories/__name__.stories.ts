import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { __Name__ } from '@dunky.dev/vue-__name__'

const meta: Meta<typeof __Name__> = {
  title: 'Primitives/__Name__',
  component: __Name__,
}

export default meta
type StoryType = StoryObj<typeof __Name__>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on every part is the real styling hook.
export const standard: StoryType = {
  render: () => ({
    setup: () => () =>
      h(__Name__, { onDisable: () => console.log('disabled') }, {
        default: () => h(__Name__.Root, null, { default: () => 'go' }),
      }),
  }),
}
