import type { Meta, StoryObj } from '@storybook/react-vite'
import { __Name__ } from '@dunky.dev/react-__name__'

const meta: Meta<typeof __Name__> = {
  title: 'Primitives/__Name__',
  component: __Name__,
}

export default meta
type StoryType = StoryObj<typeof __Name__>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on every part is the real styling hook.
export const standard: StoryType = {
  render: () => (
    <__Name__ onActivate={() => console.log('activated')}>
      <__Name__.Root>go</__Name__.Root>
    </__Name__>
  ),
}
