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
import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'
import { useScrollLock } from '@dunky.dev/react-use-scroll-lock'
import type { DialogOptions } from '@dunky.dev/dialog'

import { mergeProps, toDomProps } from './bindings'
import { DialogContext, DialogDepthContext, useDialogContext } from './context'
import { getInitialFocus } from './get-initial-focus'
import { isTopmostDialog, registerDialog } from './stack'
import { useDialog } from './use-dialog'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Dialog> — root, owns the machine and renders no DOM
// =============================================================================

export interface DialogProps extends DialogOptions {
  children?: ReactNode
}

export const Dialog: ((props: DialogProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const depth = useContext(DialogDepthContext) + 1
  const value = useDialog(options)
  return (
    <DialogDepthContext.Provider value={depth}>
      <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
    </DialogDepthContext.Provider>
  )
}

// =============================================================================
// <Dialog.Trigger> — toggles the dialog; focus returns here on close
// =============================================================================

export interface DialogTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const Trigger: PartComponent<DialogTriggerProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  DialogTriggerProps
>((props, forwardedRef) => {
  const { api } = useDialogContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, toDomProps(api.parts.trigger))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Portal> — teleports the layers out of the tree while open
// =============================================================================

export interface DialogPortalProps {
  children?: ReactNode
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal = ({ children, container }: DialogPortalProps): ReactNode => {
  const { api } = useDialogContext()
  if (!api.open || typeof document === 'undefined') return null
  return createPortal(children, container ?? document.body)
}

// =============================================================================
// <Dialog.Backdrop> — the layer behind the dialog window
// =============================================================================

export interface DialogBackdropProps extends ComponentPropsWithoutRef<'div'> {}

export const Backdrop: PartComponent<DialogBackdropProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  DialogBackdropProps
>((props, forwardedRef) => {
  const { api, service } = useDialogContext()
  const { onClick, ...bindings } = toDomProps(api.parts.backdrop) as {
    onClick?: (event: MouseEvent<HTMLDivElement>) => void
  } & Record<string, unknown>

  const merged = mergeProps(props as Record<string, unknown>, {
    ...bindings,
    // Only the topmost dialog of a stack answers an outside press.
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      if (isTopmostDialog(service.context.ids.content)) onClick?.(event)
    },
  })

  // Only a modal dialog dims the page — non-modal coexists with it.
  if (!service.context.modal) return null

  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Viewport> — the positioning + scroll layer around the dialog window
// =============================================================================

export interface DialogViewportProps extends ComponentPropsWithoutRef<'div'> {}

export const Viewport: PartComponent<DialogViewportProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  DialogViewportProps
>((props, forwardedRef) => {
  const { api, service } = useDialogContext()
  const { onClick, ...bindings } = toDomProps(api.parts.viewport) as {
    onClick?: (event: MouseEvent<HTMLDivElement>) => void
  } & Record<string, unknown>

  const merged = mergeProps(props as Record<string, unknown>, {
    ...bindings,
    // Content presses bubble up here — only a press that started on the
    // viewport itself is an outside interaction, and only the topmost dialog
    // of a stack answers it.
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return
      if (!isTopmostDialog(service.context.ids.content)) return
      onClick?.(event)
    },
  })

  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Content> — the dialog window: focus moves in on open, restores on
// close, traps while modal
// =============================================================================

export interface DialogContentProps extends ComponentPropsWithoutRef<'dialog'> {
  /** The element to focus when the dialog opens. @default the dialog window */
  initialFocus?: RefObject<HTMLElement | null>
}

export const Content: PartComponent<DialogContentProps, HTMLDialogElement> = forwardRef<
  HTMLDialogElement,
  DialogContentProps
>(({ initialFocus, ...props }, forwardedRef) => {
  const { api, service } = useDialogContext()
  const depth = useContext(DialogDepthContext)
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
    const unregister = registerDialog({
      id: service.context.ids.content,
      depth,
      element: content,
      modal: service.context.modal,
    })

    const target = initialFocusRef.current?.current ?? getInitialFocus(content)
    target.focus()
    // A target that can't take focus (disabled, hidden) falls back to the panel.
    if (document.activeElement !== target) content.focus()

    return () => {
      unregister()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [service, depth])

  // Content only mounts while open, so the lock spans exactly the open state.
  useScrollLock(service.context.modal)

  useFocusTrap(contentRef, {
    // Only a modal dialog traps, and only while topmost — a nested dialog
    // owns focus while open.
    enabled: () => service.context.modal && isTopmostDialog(service.context.ids.content),
  })

  const merged = mergeProps(props as Record<string, unknown>, {
    ...toDomProps(api.parts.content),
    // The native <dialog> is display:none without `open`; Content only mounts
    // while the dialog is open, so the attribute is unconditionally true.
    open: true,
  })

  return <dialog {...merged} ref={contentRef} />
})

// =============================================================================
// <Dialog.Title> — the dialog's accessible name
// =============================================================================

export interface DialogTitleProps extends ComponentPropsWithoutRef<'h2'> {}

export const Title: PartComponent<DialogTitleProps, HTMLHeadingElement> = forwardRef<
  HTMLHeadingElement,
  DialogTitleProps
>((props, forwardedRef) => {
  const { api, service } = useDialogContext()

  useEffect(() => {
    service.send({ type: 'part.presence', part: 'title', present: true })
    return () => service.send({ type: 'part.presence', part: 'title', present: false })
  }, [service])

  const merged = mergeProps(props as Record<string, unknown>, toDomProps(api.parts.title))
  return <h2 {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Description> — the dialog's accessible description
// =============================================================================

export interface DialogDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const Description: PartComponent<DialogDescriptionProps, HTMLParagraphElement> = forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>((props, forwardedRef) => {
  const { api, service } = useDialogContext()

  useEffect(() => {
    service.send({ type: 'part.presence', part: 'description', present: true })
    return () => service.send({ type: 'part.presence', part: 'description', present: false })
  }, [service])

  const merged = mergeProps(props as Record<string, unknown>, toDomProps(api.parts.description))
  return <p {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Close> — the visible in-dialog close affordance
// =============================================================================

export interface DialogCloseProps extends ComponentPropsWithoutRef<'button'> {}

export const Close: PartComponent<DialogCloseProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  DialogCloseProps
>((props, forwardedRef) => {
  const { api } = useDialogContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, toDomProps(api.parts.close))
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

Dialog.Trigger = Trigger
Dialog.Portal = Portal
Dialog.Backdrop = Backdrop
Dialog.Viewport = Viewport
Dialog.Content = Content
Dialog.Title = Title
Dialog.Description = Description
Dialog.Close = Close
