import type { Component } from 'vue'
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
// as such, derived from the parts themselves so none can be missed.
const components: Record<string, Component> = { __Name__ }
for (const [name, part] of Object.entries(__Name__)) {
  if (/^[A-Z]/.test(name)) components[`__Name__.${name}`] = part as Component
}

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
