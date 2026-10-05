import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { __Name__ } from '@dunky.dev/vue-__name__'

const meta: Meta<typeof __Name__> = {
  title: 'Primitives/__Name__',
  component: __Name__,
}

export default meta
type StoryType = StoryObj<typeof __Name__>

// Runtime-compiled templates resolve components by registered name, so the
// dotted part names an SFC resolves from the `__Name__` import are registered
// as such.
const components = { __Name__, '__Name__.Root': __Name__.Root }

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on every part is the real styling hook.
export const standard: StoryType = {
  render: () => ({
    components,
    setup: () => ({ disable: () => console.log('disabled') }),
    template: `
      <__Name__ @disable="disable">
        <__Name__.Root>go</__Name__.Root>
      </__Name__>
    `,
  }),
}
