import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { CollapsibleOptions } from '@dunky.dev/collapsible'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { CollapsibleContext, useCollapsibleContext } from './context'
import { useCollapsible } from './use-collapsible'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Collapsible> — root, owns the machine and renders no DOM
// =============================================================================

export interface CollapsibleProps extends CollapsibleOptions {
  children?: ReactNode
}

export const Collapsible: ((props: CollapsibleProps) => ReactNode) & Parts = ({
  children,
  ...options
}) => {
  const value = useCollapsible(options)
  return <CollapsibleContext.Provider value={value}>{children}</CollapsibleContext.Provider>
}

// =============================================================================
// <Collapsible.Trigger> — toggles the content
// =============================================================================

export interface CollapsibleTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<CollapsibleTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>((props, forwardedRef) => {
  const { api } = useCollapsibleContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.trigger))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Collapsible.Content> — the disclosed region; hidden while closed, never
// unmounted
// =============================================================================

export interface CollapsibleContentProps extends ComponentPropsWithoutRef<'div'> {}

export const Content: PartComponent<CollapsibleContentProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>((props, forwardedRef) => {
  const { api } = useCollapsibleContext()
  const bindings = normalize(api.parts.content)
  // The core's logical `hidden` renders as aria-hidden; on the web the closed
  // content must also leave the layout, so mirror the core's value as the
  // native attribute — reading the binding keeps closed-means-hidden decided in
  // the core only. Omitted while open so a consumer-passed `hidden` survives.
  if (api.parts.content.hidden !== undefined) bindings.hidden = api.parts.content.hidden
  const merged = mergeProps(props as Record<string, unknown>, bindings)
  return <div {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Trigger: typeof Trigger
  Content: typeof Content
}

Collapsible.Trigger = Trigger
Collapsible.Content = Content
