import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { TabsOptions } from '@dunky.dev/tabs'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { TabsContext, useTabsContext } from './context'
import { useTabs } from './use-tabs'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Tabs> — root, owns the machine and renders no DOM
// =============================================================================

export interface TabsProps extends TabsOptions {
  children?: ReactNode
}

export const Tabs: ((props: TabsProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const value = useTabs(options)
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

// =============================================================================
// <Tabs.List> — the tab strip; the keyboard surface
// =============================================================================

export interface TabsListProps extends ComponentPropsWithoutRef<'div'> {}

export const List: PartComponent<TabsListProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  TabsListProps
>((props, forwardedRef) => {
  const { api } = useTabsContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.list))
  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Tabs.Trigger> — one tab per panel, addressed by its value
// =============================================================================

export interface TabsTriggerProps extends ComponentPropsWithoutRef<'button'> {
  /** The tab's value — pairs it with the `Tabs.Content` of the same value. */
  value: string
}

export const Trigger: PartComponent<TabsTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(({ value, ...props }, forwardedRef) => {
  const { api, machine } = useTabsContext()
  const disabled = props.disabled === true
  const triggerRef = useRef<HTMLButtonElement>(null)
  useImperativeHandle(forwardedRef, () => triggerRef.current as HTMLButtonElement)

  // Registration order is the machine's navigation order — sibling triggers
  // mount in DOM order. A disabled change re-registers through the second
  // effect: the upsert updates the flag in place, keeping the slot.
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  useEffect(() => {
    machine.send({ type: 'tab.register', value, disabled: disabledRef.current })
    return () => machine.send({ type: 'tab.unregister', value })
  }, [machine, value])
  useEffect(() => {
    machine.send({ type: 'tab.register', value, disabled })
  }, [machine, value, disabled])

  // The machine designates the focused tab; moving real DOM focus is the
  // substrate's execution of that decision.
  const isFocused = api.focused && api.focusedValue === value
  useEffect(() => {
    if (isFocused) triggerRef.current?.focus()
  }, [isFocused])

  const merged = mergeProps(
    { type: 'button' as const, ...props },
    normalize(api.parts.trigger({ value, disabled })),
  )
  return <button {...merged} ref={triggerRef} />
})

// =============================================================================
// <Tabs.Content> — one panel per tab; hidden unless its value is selected
// =============================================================================

export interface TabsContentProps extends ComponentPropsWithoutRef<'div'> {
  /** The panel's value — pairs it with the `Tabs.Trigger` of the same value. */
  value: string
}

export const Content: PartComponent<TabsContentProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  TabsContentProps
>(({ value, ...props }, forwardedRef) => {
  const { api } = useTabsContext()
  // The core hides an unselected panel; on the web that's the native `hidden`
  // attribute (which already removes it from the accessibility tree), not
  // aria-hidden.
  const { hidden, ...bindings } = api.parts.content({ value })
  const merged = mergeProps(props as Record<string, unknown>, {
    ...normalize(bindings),
    hidden: hidden === true,
  })
  return <div {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  List: typeof List
  Trigger: typeof Trigger
  Content: typeof Content
}

Tabs.List = List
Tabs.Trigger = Trigger
Tabs.Content = Content
