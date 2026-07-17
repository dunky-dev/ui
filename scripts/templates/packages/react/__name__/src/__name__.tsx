import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { __Name__Options } from '@dunky.dev/__name__'

import { toDomProps } from '@dunky.dev/dom-bindings'
import { mergeProps } from '@dunky.dev/merge-props'
import { __Name__Context, use__Name__Context } from './context'
import { use__Name__ } from './use-__name__'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <__Name__> — root, owns the machine and renders no DOM
// =============================================================================

export interface __Name__Props extends __Name__Options {
  children?: ReactNode
}

export const __Name__: ((props: __Name__Props) => ReactNode) & Parts = ({
  children,
  ...options
}) => {
  const value = use__Name__(options)
  return <__Name__Context.Provider value={value}>{children}</__Name__Context.Provider>
}

// =============================================================================
// <__Name__.Root> — placeholder part: wires the root bindings onto an element.
// TODO(spec): replace with one part per piece of the anatomy in SPEC.md.
// =============================================================================

export interface __Name__RootProps extends ComponentPropsWithoutRef<'button'> {}

export const Root: PartComponent<__Name__RootProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  __Name__RootProps
>((props, forwardedRef) => {
  const { api } = use__Name__Context()
  const merged = mergeProps({ type: 'button' as const, ...props }, toDomProps(api.parts.root))
  return <button {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Root: typeof Root
}

__Name__.Root = Root
