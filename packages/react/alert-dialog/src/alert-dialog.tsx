import {
  forwardRef,
  useContext,
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
import { registerLayer, isTopmostLayer } from '@dunky.dev/dom-layer-stack'
import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'
import { LayerDepthContext, useLayerDepth } from '@dunky.dev/react-use-layer-stack'
import { useScrollLock } from '@dunky.dev/react-use-scroll-lock'
import type { AlertDialogOptions } from '@dunky.dev/alert-dialog'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { AlertDialogContext, AlertDialogPortalContext, useAlertDialogContext } from './context'
import { getInitialFocus } from './utils/get-initial-focus'
import { useAlertDialog } from './use-alert-dialog'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <AlertDialog> — root, owns the machine and renders no DOM
// =============================================================================

export interface AlertDialogProps extends AlertDialogOptions {
  children?: ReactNode
}

export const AlertDialog: ((props: AlertDialogProps) => ReactNode) & Parts = ({
  children,
  ...options
}) => {
  const depth = useLayerDepth() + 1
  const value = useAlertDialog(options)
  return (
    <LayerDepthContext.Provider value={depth}>
      <AlertDialogContext.Provider value={value}>{children}</AlertDialogContext.Provider>
    </LayerDepthContext.Provider>
  )
}

// =============================================================================
// <AlertDialog.Trigger> — toggles the alert dialog; focus returns here on close
// =============================================================================

export interface AlertDialogTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<AlertDialogTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  AlertDialogTriggerProps
>((props, forwardedRef) => {
  const { api } = useAlertDialogContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.trigger))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <AlertDialog.Portal> — teleports the layers out of the tree while open
// =============================================================================

export interface AlertDialogPortalProps {
  children?: ReactNode
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal = ({ children, container }: AlertDialogPortalProps): ReactNode => {
  const { api } = useAlertDialogContext()
  if (!api.open || typeof document === 'undefined') return null
  // Publish the scoped container (null = page body) so Content locks the right
  // scroll surface.
  return createPortal(
    <AlertDialogPortalContext.Provider value={container ?? null}>
      {children}
    </AlertDialogPortalContext.Provider>,
    container ?? document.body,
  )
}

// =============================================================================
// <AlertDialog.Backdrop> — the layer behind the alert dialog window; carries
// no press behavior: an outside interaction never dismisses an alert dialog
// =============================================================================

export interface AlertDialogBackdropProps extends ComponentPropsWithoutRef<'div'> {}

export const Backdrop: PartComponent<AlertDialogBackdropProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  AlertDialogBackdropProps
>((props, forwardedRef) => {
  const { api } = useAlertDialogContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.backdrop))
  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <AlertDialog.Viewport> — the positioning + scroll layer around the window;
// like the Backdrop, pressing it is not a dismissal
// =============================================================================

export interface AlertDialogViewportProps extends ComponentPropsWithoutRef<'div'> {}

export const Viewport: PartComponent<AlertDialogViewportProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  AlertDialogViewportProps
>((props, forwardedRef) => {
  const { api } = useAlertDialogContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.viewport))
  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <AlertDialog.Content> — the alert dialog window: focus moves in on open,
// restores on close, traps while open
// =============================================================================

export interface AlertDialogContentProps extends ComponentPropsWithoutRef<'dialog'> {
  /** The element to focus when the alert dialog opens. @default the rendered
   * Cancel, falling back to the alert dialog window */
  initialFocus?: RefObject<HTMLElement | null>
}

export const Content: PartComponent<AlertDialogContentProps, HTMLDialogElement> = forwardRef<
  HTMLDialogElement,
  AlertDialogContentProps
>(({ initialFocus, ...props }, forwardedRef) => {
  const { api, machine } = useAlertDialogContext()
  const depth = useLayerDepth()
  const portalContainer = useContext(AlertDialogPortalContext)
  const contentRef = useRef<HTMLDialogElement>(null)
  useImperativeHandle(forwardedRef, () => contentRef.current as HTMLDialogElement)
  const initialFocusRef = useRef(initialFocus)
  initialFocusRef.current = initialFocus
  // Stable for the machine's lifetime — safe as an effect dep.
  const cancelId = api.ids.cancel

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
      // Always modal — modality is the pattern, not an option.
      modal: true,
    })

    // preventScroll everywhere: the scroll lock already froze the surface, so
    // moving focus must not scroll it — otherwise opening jumps the (top-of-
    // container) dialog into view and closing jumps back to the trigger.
    const target = initialFocusRef.current?.current ?? getInitialFocus(content, cancelId)
    target.focus({ preventScroll: true })
    // A target that can't take focus (disabled, hidden) falls back to the panel.
    if (document.activeElement !== target) content.focus({ preventScroll: true })

    return () => {
      unregister()
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [machine, depth, cancelId])

  // Content only mounts while open, so the lock spans exactly the open state.
  // A scoped alert dialog locks its portal container; a page one locks the body.
  useScrollLock(true, portalContainer)

  useFocusTrap(contentRef, {
    // Always modal, so always trapping — but only while topmost: a nested
    // layer owns focus while open.
    enabled: () => isTopmostLayer(machine.context.id),
  })

  const merged = mergeProps(props as Record<string, unknown>, {
    ...normalize(api.parts.content),
    // The native <dialog> is display:none without `open`; Content only mounts
    // while the alert dialog is open, so the attribute is unconditionally true.
    open: true,
  })

  return <dialog {...merged} ref={contentRef} />
})

// =============================================================================
// <AlertDialog.Title> — the alert dialog's accessible name
// =============================================================================

export interface AlertDialogTitleProps extends ComponentPropsWithoutRef<'h2'> {}

export const Title: PartComponent<AlertDialogTitleProps, HTMLHeadingElement> = forwardRef<
  HTMLHeadingElement,
  AlertDialogTitleProps
>((props, forwardedRef) => {
  const { api, machine } = useAlertDialogContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'title', present: true })
    return () => machine.send({ type: 'part.presence', part: 'title', present: false })
  }, [machine])

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.title))
  return <h2 {...merged} ref={forwardedRef} />
})

// =============================================================================
// <AlertDialog.Description> — the alert dialog's accessible description
// =============================================================================

export interface AlertDialogDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const Description: PartComponent<AlertDialogDescriptionProps, HTMLParagraphElement> =
  forwardRef<HTMLParagraphElement, AlertDialogDescriptionProps>((props, forwardedRef) => {
    const { api, machine } = useAlertDialogContext()

    useEffect(() => {
      machine.send({ type: 'part.presence', part: 'description', present: true })
      return () => machine.send({ type: 'part.presence', part: 'description', present: false })
    }, [machine])

    const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.description))
    return <p {...merged} ref={forwardedRef} />
  })

// =============================================================================
// <AlertDialog.Cancel> — the least destructive answer: closes, takes initial
// focus on open
// =============================================================================

export interface AlertDialogCancelProps extends ComponentPropsWithoutRef<'button'> {}

export const Cancel: PartComponent<AlertDialogCancelProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  AlertDialogCancelProps
>((props, forwardedRef) => {
  const { api } = useAlertDialogContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.cancel))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <AlertDialog.Action> — the confirming answer: closes; the consumer's own
// handler performs the confirmed work
// =============================================================================

export interface AlertDialogActionProps extends ComponentPropsWithoutRef<'button'> {}

export const Action: PartComponent<AlertDialogActionProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  AlertDialogActionProps
>((props, forwardedRef) => {
  const { api } = useAlertDialogContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.action))
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
  Cancel: typeof Cancel
  Action: typeof Action
}

AlertDialog.Trigger = Trigger
AlertDialog.Portal = Portal
AlertDialog.Backdrop = Backdrop
AlertDialog.Viewport = Viewport
AlertDialog.Content = Content
AlertDialog.Title = Title
AlertDialog.Description = Description
AlertDialog.Cancel = Cancel
AlertDialog.Action = Action
