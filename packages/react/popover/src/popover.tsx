import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { isTopmostLayer, layerContainsTarget, registerLayer } from '@dunky.dev/dom-layer-stack'
import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'
import { useInteractOutside } from '@dunky.dev/react-use-interact-outside'
import { LayerDepthContext, useLayerDepth } from '@dunky.dev/react-use-layer-stack'
import type { PointerPayload, PopoverOptions } from '@dunky.dev/popover'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { PopoverContext, usePopoverContext } from './context'
import { getInitialFocus } from './utils/get-initial-focus'
import { usePopover } from './use-popover'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Popover> — root, owns the machine and renders no DOM
// =============================================================================

export interface PopoverProps extends PopoverOptions {
  children?: ReactNode
}

export const Popover: ((props: PopoverProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const depth = useLayerDepth() + 1
  const value = usePopover(options)
  return (
    <LayerDepthContext.Provider value={depth}>
      <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
    </LayerDepthContext.Provider>
  )
}

// =============================================================================
// <Popover.Trigger> — toggles the popover; focus returns here on close
// =============================================================================

export interface PopoverTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<PopoverTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  PopoverTriggerProps
>((props, forwardedRef) => {
  const { api, triggerRef } = usePopoverContext()
  useImperativeHandle(forwardedRef, () => triggerRef.current as HTMLButtonElement)
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.trigger))
  return <button {...merged} ref={triggerRef} />
})

// =============================================================================
// <Popover.Portal> — teleports the panel out of the tree while open
// =============================================================================

export interface PopoverPortalProps {
  children?: ReactNode
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal = ({ children, container }: PopoverPortalProps): ReactNode => {
  const { api } = usePopoverContext()
  if (!api.open || typeof document === 'undefined') return null
  return createPortal(children, container ?? document.body)
}

// =============================================================================
// <Popover.Content> — the floating panel: focus moves in on open, outside
// interaction dismisses while non-modal, focus traps while modal
// =============================================================================

export interface PopoverContentProps extends ComponentPropsWithoutRef<'div'> {
  /** The element to focus when the popover opens.
   * @default the panel's first focusable, else the panel */
  initialFocus?: RefObject<HTMLElement | null>
}

export const Content: PartComponent<PopoverContentProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(({ initialFocus, ...props }, forwardedRef) => {
  const { api, machine, triggerRef } = usePopoverContext()
  const depth = useLayerDepth()
  const contentRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => contentRef.current as HTMLDivElement)
  const initialFocusRef = useRef(initialFocus)
  initialFocusRef.current = initialFocus

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
      modal: machine.context.modal,
    })

    const designated = initialFocusRef.current?.current
    designated?.focus({ preventScroll: true })
    // A designated target that can't take focus (disabled, hidden) falls down
    // the chain: the panel's first focusable, else the panel itself.
    if (document.activeElement !== designated) {
      const fallback = getInitialFocus(content)
      fallback.focus({ preventScroll: true })
      if (document.activeElement !== fallback) content.focus({ preventScroll: true })
    }

    return () => {
      unregister()
      // Restore only when the panel owned focus at close (it fell back to the
      // body when the panel unmounted) — a focus-out dismissal leaves focus
      // where the user sent it.
      const active = document.activeElement
      if (active !== null && active !== document.body && !content.contains(active)) return
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [machine, depth])

  useInteractOutside(contentRef, {
    // Only the topmost layer of a stack answers an outside interaction. The
    // result is an intent: the api fires the consumer's veto handler, then the
    // machine gates dismissal.
    onInteractOutside: () => {
      if (!isTopmostLayer(machine.context.id)) return
      // The payload owns the veto flag: a focus-out rides `focusin`, which is
      // not cancelable — the native preventDefault() is a no-op there — so
      // deferring to the native event would silently drop the consumer's veto.
      // It also keeps a veto from canceling the page's own press.
      const payload: PointerPayload = {
        defaultPrevented: false,
        preventDefault() {
          payload.defaultPrevented = true
        },
      }
      api.onInteractOutside(payload)
    },
    // Nested layers are not outside; neither is the trigger — its press must
    // reach the machine once, as `toggle` (no dismiss-then-reopen flicker).
    ignore: target =>
      layerContainsTarget(machine.context.id, target) ||
      triggerRef.current?.contains(target) === true,
  })

  useFocusTrap(contentRef, {
    // Only a modal popover traps, and only while topmost — a nested layer
    // owns focus while open.
    enabled: () => machine.context.modal && isTopmostLayer(machine.context.id),
  })

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.content))
  return <div {...merged} ref={contentRef} />
})

// =============================================================================
// <Popover.Title> — the popover's accessible name
// =============================================================================

export interface PopoverTitleProps extends ComponentPropsWithoutRef<'h2'> {}

export const Title: PartComponent<PopoverTitleProps, HTMLHeadingElement> = forwardRef<
  HTMLHeadingElement,
  PopoverTitleProps
>((props, forwardedRef) => {
  const { api, machine } = usePopoverContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'title', present: true })
    return () => machine.send({ type: 'part.presence', part: 'title', present: false })
  }, [machine])

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.title))
  return <h2 {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Popover.Description> — the popover's accessible description
// =============================================================================

export interface PopoverDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const Description: PartComponent<PopoverDescriptionProps, HTMLParagraphElement> = forwardRef<
  HTMLParagraphElement,
  PopoverDescriptionProps
>((props, forwardedRef) => {
  const { api, machine } = usePopoverContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'description', present: true })
    return () => machine.send({ type: 'part.presence', part: 'description', present: false })
  }, [machine])

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.description))
  return <p {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Popover.Close> — the visible in-panel close affordance
// =============================================================================

export interface PopoverCloseProps extends ComponentPropsWithoutRef<'button'> {}

export const Close: PartComponent<PopoverCloseProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  PopoverCloseProps
>((props, forwardedRef) => {
  const { api } = usePopoverContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.close))
  return <button {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Trigger: typeof Trigger
  Portal: typeof Portal
  Content: typeof Content
  Title: typeof Title
  Description: typeof Description
  Close: typeof Close
}

Popover.Trigger = Trigger
Popover.Portal = Portal
Popover.Content = Content
Popover.Title = Title
Popover.Description = Description
Popover.Close = Close
