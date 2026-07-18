import {
  forwardRef,
  useEffect,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { SelectOptions } from '@dunky.dev/select'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { SelectContext, SelectItemContext, useSelectContext, useSelectItemContext } from './context'
import { useSelect } from './use-select'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Select> — root, owns the machine and renders no DOM
// =============================================================================

export interface SelectProps extends SelectOptions {
  children?: ReactNode
}

export const Select: ((props: SelectProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const value = useSelect(options)
  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>
}

// =============================================================================
// <Select.Trigger> — the combobox button; keyboard focus lives here throughout
// =============================================================================

export interface SelectTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<SelectTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>((props, forwardedRef) => {
  const { api } = useSelectContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.trigger))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Select.Value> — the selected option's label, or the placeholder
// =============================================================================

export interface SelectValueProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** What to render while nothing is selected. */
  placeholder?: ReactNode
}

export const Value: PartComponent<SelectValueProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  SelectValueProps
>(({ placeholder, ...props }, forwardedRef) => {
  const { api } = useSelectContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.value))
  return (
    <span {...merged} ref={forwardedRef}>
      {api.selectedLabel ?? placeholder}
    </span>
  )
})

// =============================================================================
// <Select.Listbox> — the popup list; stays mounted while closed so items keep
// their registration and ids stable
// =============================================================================

export interface SelectListboxProps extends ComponentPropsWithoutRef<'div'> {}

export const Listbox: PartComponent<SelectListboxProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  SelectListboxProps
>((props, forwardedRef) => {
  const { api } = useSelectContext()
  const merged = mergeProps(props as Record<string, unknown>, {
    ...normalize(api.parts.listbox),
    // The core binding hides it from assistive tech; the native attribute
    // hides it visually.
    hidden: api.open ? undefined : true,
  })
  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Select.Item> — one option; registers itself with the machine
// =============================================================================

export interface SelectItemProps extends ComponentPropsWithoutRef<'div'> {
  /** The option's value. Required, unique per select. */
  value: string
  /** Disables this option: skipped by navigation, not selectable. @default false */
  disabled?: boolean
  /** The label used for typeahead and Select.Value. Defaults to the item's
   * string children, else the value. */
  label?: string
}

export const Item: PartComponent<SelectItemProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  SelectItemProps
>(({ value, disabled = false, label, ...props }, forwardedRef) => {
  const { api, machine } = useSelectContext()
  const itemLabel = label ?? (typeof props.children === 'string' ? props.children : value)

  // Two lifecycles: a label/disabled change re-registers in place (the option
  // keeps its navigation position); only unmount or a value change unregisters.
  useEffect(() => {
    machine.send({ type: 'item.register', item: { value, label: itemLabel, disabled } })
  }, [machine, value, itemLabel, disabled])

  useEffect(() => () => machine.send({ type: 'item.unregister', value }), [machine, value])

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.parts.item({ value, disabled })),
  )
  return (
    <SelectItemContext.Provider value={value}>
      <div {...merged} ref={forwardedRef} />
    </SelectItemContext.Provider>
  )
})

// =============================================================================
// <Select.ItemIndicator> — the selection mark; only the selected item shows it
// =============================================================================

export interface SelectItemIndicatorProps extends ComponentPropsWithoutRef<'span'> {}

export const ItemIndicator: PartComponent<SelectItemIndicatorProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  SelectItemIndicatorProps
>((props, forwardedRef) => {
  const { api } = useSelectContext()
  const itemValue = useSelectItemContext()
  if (api.value !== itemValue) return null
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.itemIndicator))
  return <span {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Trigger: typeof Trigger
  Value: typeof Value
  Listbox: typeof Listbox
  Item: typeof Item
  ItemIndicator: typeof ItemIndicator
}

Select.Trigger = Trigger
Select.Value = Value
Select.Listbox = Listbox
Select.Item = Item
Select.ItemIndicator = ItemIndicator
