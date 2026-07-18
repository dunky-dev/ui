import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type MouseEvent,
  type ReactNode,
  type RefAttributes,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { isTopmostLayer, registerLayer } from '@dunky.dev/dom-layer-stack'
import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'
import { LayerDepthContext, useLayerDepth } from '@dunky.dev/react-use-layer-stack'
import { useScrollLock } from '@dunky.dev/react-use-scroll-lock'
import type { DrawerOptions } from '@dunky.dev/drawer'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { DrawerContext, DrawerPortalContext, useDrawerContext } from './context'
import { getInitialFocus } from './utils/get-initial-focus'
import { useDrawer } from './use-drawer'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Drawer> — root, owns the machine and renders no DOM
// =============================================================================

export interface DrawerProps extends DrawerOptions {
  children?: ReactNode
}

export const Drawer: ((props: DrawerProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const depth = useLayerDepth() + 1
  const value = useDrawer(options)
  return (
    <LayerDepthContext.Provider value={depth}>
      <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
    </LayerDepthContext.Provider>
  )
}

// =============================================================================
// <Drawer.Trigger> — toggles the drawer; focus returns here on close
// =============================================================================

export interface DrawerTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<DrawerTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  DrawerTriggerProps
>((props, forwardedRef) => {
  const { api } = useDrawerContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.trigger))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Drawer.Portal> — teleports the layers out of the tree while open
// =============================================================================

export interface DrawerPortalProps {
  children?: ReactNode
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal = ({ children, container }: DrawerPortalProps): ReactNode => {
  const { api } = useDrawerContext()
  if (!api.open || typeof document === 'undefined') return null
  // Publish the scoped container (null = page body) so Content locks the right
  // scroll surface.
  return createPortal(
    <DrawerPortalContext.Provider value={container ?? null}>
      {children}
    </DrawerPortalContext.Provider>,
    container ?? document.body,
  )
}

// =============================================================================
// <Drawer.Backdrop> — the layer behind the drawer panel
// =============================================================================

export interface DrawerBackdropProps extends ComponentPropsWithoutRef<'div'> {}

export const Backdrop: PartComponent<DrawerBackdropProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  DrawerBackdropProps
>((props, forwardedRef) => {
  const { api, machine } = useDrawerContext()
  const { onClick, ...bindings } = normalize(api.parts.backdrop) as {
    onClick?: (event: MouseEvent<HTMLDivElement>) => void
  } & Record<string, unknown>

  const merged = mergeProps(props as Record<string, unknown>, {
    ...bindings,
    // Only the topmost layer of a stack answers an outside press.
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      if (isTopmostLayer(machine.context.id)) onClick?.(event)
    },
  })

  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Drawer.Viewport> — the positioning layer that anchors the panel to its edge
// =============================================================================

export interface DrawerViewportProps extends ComponentPropsWithoutRef<'div'> {}

export const Viewport: PartComponent<DrawerViewportProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  DrawerViewportProps
>((props, forwardedRef) => {
  const { api, machine } = useDrawerContext()
  const { onClick, ...bindings } = normalize(api.parts.viewport) as {
    onClick?: (event: MouseEvent<HTMLDivElement>) => void
  } & Record<string, unknown>

  const merged = mergeProps(props as Record<string, unknown>, {
    ...bindings,
    // Content presses bubble up here — only a press that started on the
    // viewport itself is an outside interaction, and only the topmost layer
    // of a stack answers it.
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return
      if (!isTopmostLayer(machine.context.id)) return
      onClick?.(event)
    },
  })

  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Drawer.Content> — the drawer panel: focus moves in on open, restores on
// close, traps while open
// =============================================================================

export interface DrawerContentProps extends ComponentPropsWithoutRef<'dialog'> {
  /** The element to focus when the drawer opens. @default the drawer panel */
  initialFocus?: RefObject<HTMLElement | null>
}

export const Content: PartComponent<DrawerContentProps, HTMLDialogElement> = forwardRef<
  HTMLDialogElement,
  DrawerContentProps
>(({ initialFocus, ...props }, forwardedRef) => {
  const { api, machine } = useDrawerContext()
  const depth = useLayerDepth()
  const portalContainer = useContext(DrawerPortalContext)
  const contentRef = useRef<HTMLDialogElement>(null)
  useImperativeHandle(forwardedRef, () => contentRef.current as HTMLDialogElement)
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
      // A drawer is always modal — it always anchors containment.
      modal: true,
    })

    // preventScroll everywhere: the scroll lock already froze the surface, so
    // moving focus must not scroll it — otherwise opening jumps the (top-of-
    // container) panel into view and closing jumps back to the trigger.
    const target = initialFocusRef.current?.current ?? getInitialFocus(content)
    target.focus({ preventScroll: true })
    // A target that can't take focus (disabled, hidden) falls back to the panel.
    if (document.activeElement !== target) content.focus({ preventScroll: true })

    return () => {
      unregister()
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [machine, depth])

  // Content only mounts while open, so the lock spans exactly the open state.
  // A scoped drawer locks its portal container; a page drawer locks the body.
  useScrollLock(true, portalContainer)

  useFocusTrap(contentRef, {
    // Only the topmost layer traps — a nested layer owns focus while open.
    enabled: () => isTopmostLayer(machine.context.id),
  })

  const merged = mergeProps(props as Record<string, unknown>, {
    ...normalize(api.parts.content),
    // The native <dialog> is display:none without `open`; Content only mounts
    // while the drawer is open, so the attribute is unconditionally true.
    open: true,
  })

  return <dialog {...merged} ref={contentRef} />
})

// =============================================================================
// <Drawer.Title> — the drawer's accessible name
// =============================================================================

export interface DrawerTitleProps extends ComponentPropsWithoutRef<'h2'> {}

export const Title: PartComponent<DrawerTitleProps, HTMLHeadingElement> = forwardRef<
  HTMLHeadingElement,
  DrawerTitleProps
>((props, forwardedRef) => {
  const { api, machine } = useDrawerContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'title', present: true })
    return () => machine.send({ type: 'part.presence', part: 'title', present: false })
  }, [machine])

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.title))
  return <h2 {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Drawer.Description> — the drawer's accessible description
// =============================================================================

export interface DrawerDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const Description: PartComponent<DrawerDescriptionProps, HTMLParagraphElement> = forwardRef<
  HTMLParagraphElement,
  DrawerDescriptionProps
>((props, forwardedRef) => {
  const { api, machine } = useDrawerContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'description', present: true })
    return () => machine.send({ type: 'part.presence', part: 'description', present: false })
  }, [machine])

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.description))
  return <p {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Drawer.Close> — the visible in-drawer close affordance
// =============================================================================

export interface DrawerCloseProps extends ComponentPropsWithoutRef<'button'> {}

export const Close: PartComponent<DrawerCloseProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  DrawerCloseProps
>((props, forwardedRef) => {
  const { api } = useDrawerContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.close))
  return <button {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Trigger: typeof Trigger
  Portal: typeof Portal
  Backdrop: typeof Backdrop
  Viewport: typeof Viewport
  Content: typeof Content
  Title: typeof Title
  Description: typeof Description
  Close: typeof Close
}

Drawer.Trigger = Trigger
Drawer.Portal = Portal
Drawer.Backdrop = Backdrop
Drawer.Viewport = Viewport
Drawer.Content = Content
Drawer.Title = Title
Drawer.Description = Description
Drawer.Close = Close
