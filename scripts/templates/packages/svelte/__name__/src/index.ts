import type { Component } from 'svelte'
import Primitive from './__name__.svelte'
import Root from './__name__-root.svelte'
import type { __Name__Props } from './types.js'

interface Parts {
  Root: typeof Root
}

// One component per file is Svelte's unit, so the compound is assembled here:
// the parts hang off the root as statics, reached as `<__Name__.Root>`. The
// root binds nothing (`''`) — widen it only for a prop that can hold a binding.
export const __Name__: Component<__Name__Props, {}, ''> & Parts = Object.assign(Primitive, {
  Root,
})

export type { __Name__Props, __Name__RootProps } from './types.js'
export type { __Name__Callbacks, __Name__Options } from '@dunky.dev/__name__'
