import {
  forwardRef,
  useEffect,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { AccordionOptions } from '@dunky.dev/accordion'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import {
  AccordionContext,
  AccordionItemContext,
  useAccordionContext,
  useAccordionItemContext,
} from './context'
import { useAccordion } from './use-accordion'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Accordion> — root, owns the machine and renders no DOM
// =============================================================================

export type AccordionProps = AccordionOptions & { children?: ReactNode }

export const Accordion: ((props: AccordionProps) => ReactNode) & Parts = ({
  children,
  ...options
}) => {
  const value = useAccordion(options)
  return <AccordionContext.Provider value={value}>{children}</AccordionContext.Provider>
}

// =============================================================================
// <Accordion.Item> — one disclosure; registers itself and scopes its parts
// =============================================================================

export interface AccordionItemProps extends ComponentPropsWithoutRef<'div'> {
  /** The item's identity in the accordion's value. */
  value: string
  /** Disables this item. @default false */
  disabled?: boolean
}

export const Item: PartComponent<AccordionItemProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  AccordionItemProps
>(({ value, disabled = false, ...props }, forwardedRef) => {
  const { api, machine } = useAccordionContext()

  // Registration order is the keyboard navigation order. A disabled flip
  // re-registers (the machine upserts in place); only unmount unregisters.
  useEffect(() => {
    machine.send({ type: 'item.register', value, disabled })
  }, [machine, value, disabled])
  useEffect(() => () => machine.send({ type: 'item.unregister', value }), [machine, value])

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.parts.item({ value, disabled })),
  )
  return (
    <AccordionItemContext.Provider value={{ value, disabled }}>
      <div {...merged} ref={forwardedRef} />
    </AccordionItemContext.Provider>
  )
})

// =============================================================================
// <Accordion.Header> — the heading wrapper that gives the trigger its level
// =============================================================================

export interface AccordionHeaderProps extends ComponentPropsWithoutRef<'h3'> {}

export const Header: PartComponent<AccordionHeaderProps, HTMLHeadingElement> = forwardRef<
  HTMLHeadingElement,
  AccordionHeaderProps
>((props, forwardedRef) => {
  const { api } = useAccordionContext()
  const item = useAccordionItemContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.header(item)))
  return <h3 {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Accordion.Trigger> — toggles its item; hosts the arrow-key navigation
// =============================================================================

export interface AccordionTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<AccordionTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>((props, forwardedRef) => {
  const { api } = useAccordionContext()
  const item = useAccordionItemContext()
  const merged = mergeProps(
    { type: 'button' as const, ...props },
    normalize(api.parts.trigger(item)),
  )
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Accordion.Content> — the section the trigger controls; hidden while closed
// =============================================================================

export interface AccordionContentProps extends ComponentPropsWithoutRef<'div'> {}

export const Content: PartComponent<AccordionContentProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  AccordionContentProps
>((props, forwardedRef) => {
  const { api } = useAccordionContext()
  const item = useAccordionItemContext()
  const merged = mergeProps(props as Record<string, unknown>, {
    ...normalize(api.parts.content(item)),
    // Content stays mounted while closed — native `hidden` is the substrate's
    // translation of the closed state and keeps the ARIA references resolvable.
    hidden: api.isItemOpen(item.value) ? undefined : true,
  })
  return <div {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Item: typeof Item
  Header: typeof Header
  Trigger: typeof Trigger
  Content: typeof Content
}

Accordion.Item = Item
Accordion.Header = Header
Accordion.Trigger = Trigger
Accordion.Content = Content
