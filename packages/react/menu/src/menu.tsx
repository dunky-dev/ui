import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { isTopmostLayer, layerContainsTarget, registerLayer } from '@dunky.dev/dom-layer-stack'
import { useInteractOutside } from '@dunky.dev/react-use-interact-outside'
import { LayerDepthContext, useLayerDepth } from '@dunky.dev/react-use-layer-stack'
import type { MenuOptions, PointerPayload } from '@dunky.dev/menu'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { MenuContext, MenuGroupContext, useMenuContext, useMenuGroupContext } from './context'
import { useMenu } from './use-menu'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Menu> — root, owns the machine and renders no DOM
// =============================================================================

export interface MenuProps extends MenuOptions {
  children?: ReactNode
}

export const Menu: ((props: MenuProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const depth = useLayerDepth() + 1
  const { api, machine } = useMenu(options)
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <LayerDepthContext.Provider value={depth}>
      <MenuContext.Provider value={{ api, machine, triggerRef }}>{children}</MenuContext.Provider>
    </LayerDepthContext.Provider>
  )
}

// =============================================================================
// <Menu.Trigger> — toggles the menu; focus returns here on close
// =============================================================================

export interface MenuTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<MenuTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  MenuTriggerProps
>((props, forwardedRef) => {
  const { api, machine, triggerRef } = useMenuContext()
  useImperativeHandle(forwardedRef, () => triggerRef.current as HTMLButtonElement)

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'trigger', present: true })
    return () => machine.send({ type: 'part.presence', part: 'trigger', present: false })
  }, [machine])

  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.trigger))
  return <button {...merged} ref={triggerRef} />
})

// =============================================================================
// <Menu.Portal> — teleports the content out of the tree while open
// =============================================================================

export interface MenuPortalProps {
  children?: ReactNode
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal = ({ children, container }: MenuPortalProps): ReactNode => {
  const { api } = useMenuContext()
  if (!api.open || typeof document === 'undefined') return null
  return createPortal(children, container ?? document.body)
}

// =============================================================================
// <Menu.Content> — the menu surface: holds DOM focus while open, restores it
// on close, dismisses on outside interaction
// =============================================================================

export interface MenuContentProps extends ComponentPropsWithoutRef<'div'> {}

export const Content: PartComponent<MenuContentProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  MenuContentProps
>((props, forwardedRef) => {
  const { api, machine, triggerRef } = useMenuContext()
  const depth = useLayerDepth()
  const contentRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => contentRef.current as HTMLDivElement)

  // Content only mounts while open, so mount/unmount ARE the open/close edges.
  // One effect keeps the ordering right both ways: the stack joins before focus
  // moves in, and on close it must release the layers beneath (un-inert them)
  // before focus can move back out to one of them.
  useEffect(() => {
    const content = contentRef.current
    if (content === null) return

    const previous = document.activeElement
    const unregister = registerLayer({
      id: machine.context.id,
      depth,
      element: content,
      // Never modal: the menu coexists with the page (see the core SPEC).
      modal: false,
    })

    // preventScroll everywhere: the portaled content sits wherever the
    // consumer positions it — moving focus must not scroll it into view.
    content.focus({ preventScroll: true })

    return () => {
      unregister()
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [machine, depth])

  useInteractOutside(contentRef, {
    onInteractOutside: event => {
      // Only the topmost layer of a stack answers an outside interaction.
      if (!isTopmostLayer(machine.context.id)) return
      api.interactOutside(event as unknown as PointerPayload)
    },
    // A nested layer is not outside; neither is the trigger — its own press
    // toggles, and dismissing first would reopen instead of closing.
    ignore: target =>
      layerContainsTarget(machine.context.id, target) ||
      triggerRef.current?.contains(target) === true,
  })

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.content))
  return <div {...merged} ref={contentRef} />
})

// =============================================================================
// <Menu.Item> — one action: activating it reports the selection, then closes
// =============================================================================

export interface MenuItemProps extends ComponentPropsWithoutRef<'div'> {
  /** Unique, id-safe identity of the item within the menu. */
  value: string
  /** Perceivable but never highlighted or activated. @default false */
  disabled?: boolean
  /** The typeahead label, for items whose content isn't plain text — or whose
   * text changes at runtime (the fallback is read from the DOM only when
   * `value`/`textValue`/`disabled` change, not on every render).
   * @default the rendered text content */
  textValue?: string
  /** Fired when the item is activated; the menu then closes. */
  onSelect?: () => void
}

export const Item: PartComponent<MenuItemProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  MenuItemProps
>(({ value, disabled = false, textValue, onSelect, ...props }, forwardedRef) => {
  const { api, machine } = useMenuContext()
  const itemRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => itemRef.current as HTMLDivElement)

  // Items register as data — value, typeahead label, disabled — so the core
  // navigates what is actually rendered. The label falls back to the rendered
  // text, read once the element exists. Registration is split in two: the
  // mount effect owns register/unregister (registry order = mount order), and
  // the update effect re-registers on a prop change WITHOUT unregistering
  // first — the core's in-place update — so a `disabled`/`textValue` flip
  // never moves the item to the end of the navigation order.
  const textValueRef = useRef(textValue)
  textValueRef.current = textValue
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const valueRef = useRef(value)
  valueRef.current = value
  useEffect(() => {
    const label = textValueRef.current ?? itemRef.current?.textContent ?? ''
    machine.send({ type: 'item.register', item: { value, label, disabled: disabledRef.current } })
    return () => machine.send({ type: 'item.unregister', value })
  }, [machine, value])
  useEffect(() => {
    const label = textValue ?? itemRef.current?.textContent ?? ''
    machine.send({ type: 'item.register', item: { value: valueRef.current, label, disabled } })
  }, [machine, textValue, disabled])

  // The selection mailbox: the machine records the activation as a fresh
  // token; this item delivers it to its own callback. Reading through refs
  // keeps one subscription alive across re-renders — the token fires before
  // the close unmounts the item (see the core SPEC: Design).
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  useEffect(
    () =>
      machine
        .select(() => machine.context.selection)
        .subscribe(selection => {
          if (selection !== null && selection.value === valueRef.current) onSelectRef.current?.()
        }),
    [machine],
  )

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.getItemBindings({ value, disabled })),
  )
  return <div {...merged} ref={itemRef} />
})

// =============================================================================
// <Menu.Group> — groups related items under a name
// =============================================================================

export interface MenuGroupProps extends ComponentPropsWithoutRef<'div'> {}

export const Group: PartComponent<MenuGroupProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  MenuGroupProps
>((props, forwardedRef) => {
  const { api } = useMenuContext()
  const groupId = useId()
  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.getGroupBindings({ id: groupId })),
  )
  return (
    <MenuGroupContext.Provider value={groupId}>
      <div {...merged} ref={forwardedRef} />
    </MenuGroupContext.Provider>
  )
})

// =============================================================================
// <Menu.GroupLabel> — names its enclosing group
// =============================================================================

export interface MenuGroupLabelProps extends ComponentPropsWithoutRef<'div'> {}

export const GroupLabel: PartComponent<MenuGroupLabelProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  MenuGroupLabelProps
>((props, forwardedRef) => {
  const { api, machine } = useMenuContext()
  const groupId = useMenuGroupContext()

  useEffect(() => {
    machine.send({ type: 'group.label.presence', group: groupId, present: true })
    return () => machine.send({ type: 'group.label.presence', group: groupId, present: false })
  }, [machine, groupId])

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.getGroupLabelBindings({ id: groupId })),
  )
  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Menu.Separator> — divides sets of items
// =============================================================================

export interface MenuSeparatorProps extends ComponentPropsWithoutRef<'div'> {}

export const Separator: PartComponent<MenuSeparatorProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  MenuSeparatorProps
>((props, forwardedRef) => {
  const { api } = useMenuContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.separator))
  return <div {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Trigger: typeof Trigger
  Portal: typeof Portal
  Content: typeof Content
  Item: typeof Item
  Group: typeof Group
  GroupLabel: typeof GroupLabel
  Separator: typeof Separator
}

Menu.Trigger = Trigger
Menu.Portal = Portal
Menu.Content = Content
Menu.Item = Item
Menu.Group = Group
Menu.GroupLabel = GroupLabel
Menu.Separator = Separator
