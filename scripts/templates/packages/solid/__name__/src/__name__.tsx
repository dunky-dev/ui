import { omit, type Component, type JSX } from 'solid-js'
import type { ComponentProps } from '@solidjs/web'
import type { __Name__Options } from '@dunky.dev/__name__'

import { mergeProps, normalize } from '@dunky.dev/solid-state-machine'
import { __Name__Context, use__Name__Context } from './context'
import { use__Name__ } from './use-__name__'

// Bindings merge inside the JSX spread so they stay reactive. `children` must
// never ride that spread: a re-evaluated spread re-creates the children.
// Every part omits it and renders `{props.children}` explicitly.

// =============================================================================
// <__Name__> — root, owns the machine and renders no DOM
// =============================================================================

export interface __Name__Props extends __Name__Options {
  children?: JSX.Element
}

export const __Name__: Component<__Name__Props> & Parts = props => {
  const options = omit(props, 'children')
  const value = use__Name__(options)
  return <__Name__Context value={value}>{props.children}</__Name__Context>
}

// =============================================================================
// <__Name__.Root> — placeholder part: wires the root bindings onto an element.
// TODO(spec): replace with one part per piece of the anatomy in SPEC.md.
// =============================================================================

export interface __Name__RootProps extends ComponentProps<'button'> {}

export const Root: Component<__Name__RootProps> = props => {
  const { api } = use__Name__Context()
  const rest = omit(props, 'children')
  return (
    <button
      {...mergeProps<__Name__RootProps>({ type: 'button', ...rest }, normalize(api.parts.root))}
    >
      {props.children}
    </button>
  )
}

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Root: typeof Root
}

__Name__.Root = Root
