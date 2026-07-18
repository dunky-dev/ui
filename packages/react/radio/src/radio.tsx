import {
  forwardRef,
  useEffect,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { RadioOptions } from '@dunky.dev/radio'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { RadioContext, RadioItemContext, useRadioContext, useRadioItemContext } from './context'
import { useRadio } from './use-radio'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Radio> — root, owns the machine and renders no DOM
// =============================================================================

export interface RadioProps extends RadioOptions {
  children?: ReactNode
}

export const Radio: ((props: RadioProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const value = useRadio(options)
  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>
}

// =============================================================================
// <Radio.Group> — the radio group surface; carries the group semantics
// =============================================================================

export interface RadioGroupProps extends ComponentPropsWithoutRef<'div'> {}

export const Group: PartComponent<RadioGroupProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  RadioGroupProps
>((props, forwardedRef) => {
  const { api } = useRadioContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.group))
  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Radio.Item> — one option; selects on press, roving tabindex
// =============================================================================

export interface RadioItemProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value'> {
  /** The value this item represents. Required, unique within the group. */
  value: string
  /** Disables just this item; navigation skips it. */
  disabled?: boolean
}

export const Item: PartComponent<RadioItemProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  RadioItemProps
>(({ value, disabled, ...props }, forwardedRef) => {
  const { api, machine } = useRadioContext()

  // Registration order is the navigation order. Register is an upsert, so a
  // disabled flip updates the entry in place without moving it; only a
  // value change or unmount unregisters.
  useEffect(() => {
    machine.send({ type: 'item.register', value, disabled: disabled === true })
  }, [machine, value, disabled])
  useEffect(() => () => machine.send({ type: 'item.unregister', value }), [machine, value])

  const merged = mergeProps(
    { type: 'button' as const, ...props },
    normalize(api.parts.item({ value, disabled })),
  )
  return (
    <RadioItemContext.Provider
      value={{ value, disabled: disabled === true, checked: api.value === value }}
    >
      <button {...merged} ref={forwardedRef} />
    </RadioItemContext.Provider>
  )
})

// =============================================================================
// <Radio.ItemIndicator> — the visual checked mark; exists only while checked
// =============================================================================

export interface RadioItemIndicatorProps extends ComponentPropsWithoutRef<'span'> {}

export const ItemIndicator: PartComponent<RadioItemIndicatorProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  RadioItemIndicatorProps
>((props, forwardedRef) => {
  const { api } = useRadioContext()
  const item = useRadioItemContext()

  // Presence follows the core contract: the indicator exists only while its
  // item is checked.
  if (!item.checked) return null

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.parts.itemIndicator({ value: item.value, disabled: item.disabled })),
  )
  return <span {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Radio.ItemLabel> — names its item; pressing it selects the item
// =============================================================================

export interface RadioItemLabelProps extends ComponentPropsWithoutRef<'span'> {
  /** The value of the item this label names. */
  value: string
}

export const ItemLabel: PartComponent<RadioItemLabelProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  RadioItemLabelProps
>(({ value, ...props }, forwardedRef) => {
  const { api, machine } = useRadioContext()

  useEffect(() => {
    machine.send({ type: 'label.presence', value, present: true })
    return () => machine.send({ type: 'label.presence', value, present: false })
  }, [machine, value])

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.parts.itemLabel({ value })),
  )
  return <span {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Group: typeof Group
  Item: typeof Item
  ItemIndicator: typeof ItemIndicator
  ItemLabel: typeof ItemLabel
}

Radio.Group = Group
Radio.Item = Item
Radio.ItemIndicator = ItemIndicator
Radio.ItemLabel = ItemLabel
