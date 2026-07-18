import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type MouseEvent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import { isTopmostLayer, layerContainsTarget, registerLayer } from '@dunky.dev/dom-layer-stack'
import { useInteractOutside } from '@dunky.dev/react-use-interact-outside'
import { LayerDepthContext, useLayerDepth } from '@dunky.dev/react-use-layer-stack'
import type { ComboboxOptions, PointerPayload } from '@dunky.dev/combobox'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import {
  ComboboxContext,
  ComboboxItemContext,
  useComboboxContext,
  useComboboxItemContext,
} from './context'
import { documentIndex } from './utils/document-index'
import { useCombobox } from './use-combobox'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Combobox> — root, owns the machine and renders no DOM
// =============================================================================

export interface ComboboxProps extends ComboboxOptions {
  children?: ReactNode
}

export const Combobox: ((props: ComboboxProps) => ReactNode) & Parts = ({
  children,
  ...options
}) => {
  const depth = useLayerDepth() + 1
  const value = useCombobox(options)
  return (
    <LayerDepthContext.Provider value={depth}>
      <ComboboxContext.Provider value={value}>{children}</ComboboxContext.Provider>
    </LayerDepthContext.Provider>
  )
}

// =============================================================================
// <Combobox.Input> — the text field; DOM focus lives here the whole time
// =============================================================================

export interface ComboboxInputProps extends ComponentPropsWithoutRef<'input'> {}

export const Input: PartComponent<ComboboxInputProps, HTMLInputElement> = forwardRef<
  HTMLInputElement,
  ComboboxInputProps
>((props, forwardedRef) => {
  const { api, inputRef } = useComboboxContext()
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement)

  const bindings: Record<string, unknown> = {
    ...normalize(api.parts.input),
    // Machine-owned text: the input renders context, edits flow back as events.
    value: api.inputValue,
  }
  // On top of the core's aria-disabled: the native attribute is what actually
  // refuses text entry. Only set when true so a consumer prop isn't stomped.
  if (api.disabled) bindings.disabled = true

  const merged = mergeProps(props as Record<string, unknown>, bindings)
  return <input {...merged} ref={inputRef} />
})

// =============================================================================
// <Combobox.Trigger> — the optional disclosure button, not in the tab order
// =============================================================================

export interface ComboboxTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<ComboboxTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  ComboboxTriggerProps
>((props, forwardedRef) => {
  const { api, inputRef, triggerRef } = useComboboxContext()
  useImperativeHandle(forwardedRef, () => triggerRef.current as HTMLButtonElement)
  const { onClick, ...bindings } = normalize(api.parts.trigger) as {
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  } & Record<string, unknown>

  const merged = mergeProps(
    { type: 'button' as const, ...props },
    {
      ...bindings,
      // The trigger toggles and hands focus (back) to the input — it is a caret
      // on the input's popup, not a tab stop of its own (APG editable combobox).
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        inputRef.current?.focus()
      },
    },
  )

  return <button {...merged} ref={triggerRef} />
})

// =============================================================================
// <Combobox.Listbox> — the popup list; stays mounted while closed so items
// keep their registration and ids stable
// =============================================================================

export interface ComboboxListboxProps extends ComponentPropsWithoutRef<'div'> {}

export const Listbox: PartComponent<ComboboxListboxProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  ComboboxListboxProps
>((props, forwardedRef) => {
  const { api, machine, inputRef, triggerRef, listboxRef } = useComboboxContext()
  const depth = useLayerDepth()
  useImperativeHandle(forwardedRef, () => listboxRef.current as HTMLDivElement)

  // The listbox stays mounted while closed, so the open flag — not mount — is
  // the layer's lifecycle edge. No focus work interleaves with registration:
  // DOM focus never leaves the input, so opening moves nothing and closing
  // never needs a restore.
  const open = api.open
  useEffect(() => {
    const listbox = listboxRef.current
    if (!open || listbox === null) return
    return registerLayer({ id: machine.context.id, depth, element: listbox, modal: false })
  }, [open, machine, depth, listboxRef])

  useInteractOutside(listboxRef, {
    // Only the topmost layer of a stack answers an outside interaction. The
    // result is an intent: the api fires the consumer's veto handler, then the
    // machine gates dismissal.
    onInteractOutside: event => {
      if (!machine.matches('open') || !isTopmostLayer(machine.context.id)) return
      // The native event doubles as the payload — its `defaultPrevented` stays
      // live after the consumer's preventDefault() (a copy would go stale).
      api.onInteractOutside(event as PointerPayload)
    },
    // Nested layers are not outside; neither are the input and trigger — an
    // anchor press must reach the machine once (no dismiss-then-reopen).
    ignore: target =>
      layerContainsTarget(machine.context.id, target) ||
      inputRef.current?.contains(target) === true ||
      triggerRef.current?.contains(target) === true,
  })

  const merged = mergeProps(props as Record<string, unknown>, {
    ...normalize(api.parts.listbox),
    // The core binding hides it from assistive tech; the native attribute
    // hides it visually.
    hidden: api.open ? undefined : true,
  })
  return <div {...merged} ref={listboxRef} />
})

// =============================================================================
// <Combobox.Item> — one suggestion; registers itself with the machine
// =============================================================================

export interface ComboboxItemProps extends ComponentPropsWithoutRef<'div'> {
  /** The suggestion's value. Required, unique per combobox. */
  value: string
  /** Disables this suggestion: skipped by navigation, not selectable. @default false */
  disabled?: boolean
  /** The text committed to the input on selection. Defaults to the item's
   * string children, else the value. */
  label?: string
}

export const Item: PartComponent<ComboboxItemProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  ComboboxItemProps
>(({ value, disabled = false, label, ...props }, forwardedRef) => {
  const { api, machine, listboxRef } = useComboboxContext()
  const itemRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => itemRef.current as HTMLDivElement)
  const itemLabel = label ?? (typeof props.children === 'string' ? props.children : value)

  // Registration reports the item's data and its position among the rendered
  // options. The position is a host fact with no prop to depend on — consumer
  // filtering unmounts and remounts items, and a keyed re-sort moves DOM
  // nodes without changing any prop — so the report re-runs after every
  // commit; the machine ignores a report that changes nothing. Only unmount
  // or a value change unregisters.
  useEffect(() => {
    machine.send({
      type: 'item.register',
      item: { value, label: itemLabel, disabled },
      index: documentIndex(listboxRef.current, itemRef.current),
    })
  })

  useEffect(() => () => machine.send({ type: 'item.unregister', value }), [machine, value])

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.parts.item({ value, disabled })),
  )
  return (
    <ComboboxItemContext.Provider value={value}>
      <div {...merged} ref={itemRef} />
    </ComboboxItemContext.Provider>
  )
})

// =============================================================================
// <Combobox.ItemIndicator> — the selection mark; only the selected item shows it
// =============================================================================

export interface ComboboxItemIndicatorProps extends ComponentPropsWithoutRef<'span'> {}

export const ItemIndicator: PartComponent<ComboboxItemIndicatorProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  ComboboxItemIndicatorProps
>((props, forwardedRef) => {
  const { api } = useComboboxContext()
  const itemValue = useComboboxItemContext()
  if (api.value !== itemValue) return null
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.itemIndicator))
  return <span {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Input: typeof Input
  Trigger: typeof Trigger
  Listbox: typeof Listbox
  Item: typeof Item
  ItemIndicator: typeof ItemIndicator
}

Combobox.Input = Input
Combobox.Trigger = Trigger
Combobox.Listbox = Listbox
Combobox.Item = Item
Combobox.ItemIndicator = ItemIndicator
