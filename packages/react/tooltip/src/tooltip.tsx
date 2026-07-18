import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import type { TooltipOptions } from '@dunky.dev/tooltip'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { TooltipContext, useTooltipContext } from './context'
import { useTooltip } from './use-tooltip'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Tooltip> — root, owns the machine and renders no DOM
// =============================================================================

export interface TooltipProps extends TooltipOptions {
  children?: ReactNode
}

export const Tooltip: ((props: TooltipProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const value = useTooltip(options)
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
}

// =============================================================================
// <Tooltip.Trigger> — the element the tooltip describes; hover/focus opens it
// =============================================================================

export interface TooltipTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<TooltipTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  TooltipTriggerProps
>((props, forwardedRef) => {
  const { api } = useTooltipContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.trigger))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Tooltip.Portal> — teleports the content out of the tree while shown
// =============================================================================

export interface TooltipPortalProps {
  children?: ReactNode
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal = ({ children, container }: TooltipPortalProps): ReactNode => {
  const { api } = useTooltipContext()
  // api.open spans `open` + `closing`, so an exit animation keyed on
  // data-state="closing" plays before the unmount.
  if (!api.open || typeof document === 'undefined') return null
  return createPortal(children, container ?? document.body)
}

// =============================================================================
// <Tooltip.Content> — the tooltip popup (role=tooltip)
// =============================================================================

export interface TooltipContentProps extends ComponentPropsWithoutRef<'div'> {}

export const Content: PartComponent<TooltipContentProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  TooltipContentProps
>((props, forwardedRef) => {
  const { api } = useTooltipContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.content))
  return <div {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Trigger: typeof Trigger
  Portal: typeof Portal
  Content: typeof Content
}

Tooltip.Trigger = Trigger
Tooltip.Portal = Portal
Tooltip.Content = Content
