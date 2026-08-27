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

import { watchOutsidePress } from '@dunky.dev/dom-overlay'
import { trackPressOrigin } from '@dunky.dev/dom-press-origin'
import {
  acceptsBackdropPress,
  acceptsViewportPress,
  contentPointerEvents,
  dialogTrapOptions,
  guardBackNavigation,
  openDialogLayer,
  startExitWindow,
  viewportPointerEvents,
  type BackNavigationGuard,
} from '@dunky.dev/dom-dialog'
import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { DialogContext, useDialogContext } from './context'
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
  // Nesting derives from the parent dialog's context (undefined = top-level).
  const depth = (useContext(DialogContext)?.depth ?? 0) + 1
  const { api, machine } = useDialog(options)
  const backdropRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pressOriginRef = useRef<(() => boolean) | null>(null)

  // Read through a ref so the history guard's lifecycle follows the open
  // state alone: re-arming on every render (fresh callback identities) would
  // churn real session-history entries.
  const apiRef = useRef(api)
  apiRef.current = api

  // The guard lives on the root — it concerns the dialog's openness, not any
  // rendered part. It spans more than the open state, so it outlives this
  // effect: a Back-close leaves the registration parked for the Forward that
  // may reopen it, and only an unmount ends the episode outright.
  const guardRef = useRef<BackNavigationGuard | null>(null)

  useEffect(() => {
    if (!machine.context.closeOnBack) return
    guardRef.current ??= guardBackNavigation({
      backNavigate: () => apiRef.current.backNavigate(),
      forwardNavigate: () => apiRef.current.forwardNavigate(),
      isOpen: () => machine.matches('open'),
      depth,
    })
    guardRef.current.sync(api.open)
  }, [api.open, machine, depth])

  useEffect(
    () => () => {
      guardRef.current?.release()
      guardRef.current = null
    },
    [],
  )

  return (
    <DialogContext.Provider
      value={{
        api,
        machine,
        depth,
        container: null,
        backdropRef,
        contentRef,
        triggerRef,
        pressOriginRef,
      }}
    >
      {children}
    </DialogContext.Provider>
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
  const { api, triggerRef } = useDialogContext()
  useImperativeHandle(forwardedRef, () => triggerRef.current as HTMLButtonElement)
  const merged = mergeProps<DialogTriggerProps>(
    { type: 'button', ...props },
    normalize(api.parts.trigger),
  )
  return <button {...merged} ref={triggerRef} />
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
  const context = useDialogContext()
  // `mounted`, not `open`: an animated dialog stays in the tree through
  // `closing` so its exit visual can play before everything unmounts.
  if (!context.api.mounted || typeof document === 'undefined') return null
  // Re-provide the context with the scoped container (null = page body) so
  // Content locks the right scroll surface.
  return createPortal(
    <DialogContext.Provider value={{ ...context, container: container ?? null }}>
      {children}
    </DialogContext.Provider>,
    container ?? document.body,
  )
}

// =============================================================================
// <Dialog.Backdrop> — the layer behind the dialog window
// =============================================================================

export interface DialogBackdropProps extends ComponentPropsWithoutRef<'div'> {}

export const Backdrop: PartComponent<DialogBackdropProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  DialogBackdropProps
>((props, forwardedRef) => {
  const { api, machine, backdropRef, pressOriginRef } = useDialogContext()
  useImperativeHandle(forwardedRef, () => backdropRef.current as HTMLDivElement)
  const { onClick, ...bindings } = normalize(api.parts.backdrop) as {
    onClick?: (event: MouseEvent<HTMLDivElement>) => void
  } & Record<string, unknown>

  const merged = mergeProps<DialogBackdropProps>(props, {
    ...bindings,
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      if (acceptsBackdropPress(machine.context.id, pressOriginRef.current?.() ?? false))
        onClick?.(event)
    },
  })

  // Only a modal dialog dims the page — non-modal coexists with it.
  if (!machine.context.modal) return null

  return <div {...merged} ref={backdropRef} />
})

// =============================================================================
// <Dialog.Viewport> — the positioning + scroll layer around the dialog window
// =============================================================================

export interface DialogViewportProps extends ComponentPropsWithoutRef<'div'> {}

export const Viewport: PartComponent<DialogViewportProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  DialogViewportProps
>((props, forwardedRef) => {
  const { api, machine, contentRef, triggerRef, pressOriginRef } = useDialogContext()
  const { onClick, ...bindings } = normalize(api.parts.viewport) as {
    onClick?: (event: MouseEvent<HTMLDivElement>) => void
  } & Record<string, unknown>
  // Read through a ref: the watcher effect below fires from a document
  // listener, not this render's own onClick prop, so it needs the latest
  // handler without re-subscribing on every render.
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick

  const merged = mergeProps<DialogViewportProps>(props, {
    ...bindings,
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      if (acceptsViewportPress(machine.context.id, event, pressOriginRef.current?.() ?? false))
        onClickRef.current?.(event)
    },
  })

  // Non-modal: the Viewport's own pointer-events are off (see the style
  // below), so it never receives a press on the empty area to detect as
  // outside — the document is the only vantage point left.
  useEffect(() => {
    if (!api.open || machine.context.modal) return
    const content = contentRef.current
    if (content === null) return
    return watchOutsidePress(machine.context.id, {
      element: content,
      trigger: triggerRef.current,
      startedInside: () => pressOriginRef.current?.() ?? false,
      onOutsidePress: event => onClickRef.current?.(event as unknown as MouseEvent<HTMLDivElement>),
    })
  }, [api.open, machine, contentRef, triggerRef, pressOriginRef])

  // Non-modal: the page coexists with the dialog, so the empty area around
  // the window must let presses fall through rather than swallow them.
  const style = { pointerEvents: viewportPointerEvents(machine.context.modal), ...props.style }

  return <div {...merged} style={style} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Content> — the dialog window: focus moves in on open, restores on
// close, traps while modal
// =============================================================================

export interface DialogContentProps extends ComponentPropsWithoutRef<'div'> {
  /** The element to focus when the dialog opens. @default the dialog window */
  initialFocus?: RefObject<HTMLElement | null>
}

export const Content: PartComponent<DialogContentProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  DialogContentProps
>(({ initialFocus, ...props }, forwardedRef) => {
  const { api, machine, depth, container, backdropRef, contentRef, pressOriginRef } =
    useDialogContext()
  useImperativeHandle(forwardedRef, () => contentRef.current as HTMLDivElement)
  const initialFocusRef = useRef(initialFocus)
  initialFocusRef.current = initialFocus

  // The machine's `open` state is the edge, not mount/unmount — an animated
  // dialog stays mounted through `closing`. The sequence and its inverse are
  // the DOM package's; this effect only ties them to React's lifecycle.
  useEffect(() => {
    const content = contentRef.current
    if (!api.open || content === null) return

    const releaseLayer = openDialogLayer(content, {
      id: machine.context.id,
      depth,
      modal: machine.context.modal,
      backdrop: () => backdropRef.current,
      initialFocus: initialFocusRef.current?.current,
      dismiss: () => machine.send({ type: 'close' }),
    })
    // A click's own target can't tell a text-selection drag from a genuine
    // outside press once the browser has collapsed it — see
    // `trackPressOrigin`. Shared via context: Backdrop and Viewport are
    // separate parts, and both need the answer.
    const pressOrigin = trackPressOrigin(content)
    pressOriginRef.current = pressOrigin.startedInside
    return () => {
      pressOriginRef.current = null
      pressOrigin.dispose()
      releaseLayer()
    }
  }, [api.open, machine, depth, backdropRef, contentRef, pressOriginRef])

  // Content rendered while not open only happens in `closing`.
  useEffect(() => {
    const content = contentRef.current
    if (api.open || content === null) return

    return startExitWindow(content, {
      container,
      backdrop: backdropRef.current,
      onComplete: () => machine.send({ type: 'exit.complete' }),
    })
  }, [api.open, machine, container, backdropRef, contentRef])

  // The lock spans the whole mount — through `closing` too: releasing it
  // mid-exit would bring the scrollbar back and reflow the page under the
  // still-painting layer. A scoped dialog locks its portal container; a page
  // dialog locks the body. The context's `null` means "page body", not the
  // hook's "no target yet" — map it to the hook's body default.
  useScrollLock(machine.context.modal, container ?? undefined)

  useFocusTrap(
    contentRef,
    dialogTrapOptions(machine, () => api.ids.close),
  )

  // A neutral element with the role, not <dialog>: the window is the initial
  // focus target, so it carries tabindex — which HTML forbids on <dialog> —
  // and the native element only pays off via showModal(), which this contract
  // deliberately doesn't use.
  const merged = mergeProps<DialogContentProps>(props, normalize(api.parts.content))
  // Always interactive, even where a non-modal Viewport disables pointer
  // events to let presses fall through around it.
  const style = { pointerEvents: contentPointerEvents, ...props.style }

  return <div {...merged} style={style} ref={contentRef} />
})

// =============================================================================
// <Dialog.Title> — the dialog's accessible name
// =============================================================================

export interface DialogTitleProps extends ComponentPropsWithoutRef<'h2'> {}

export const Title: PartComponent<DialogTitleProps, HTMLHeadingElement> = forwardRef<
  HTMLHeadingElement,
  DialogTitleProps
>((props, forwardedRef) => {
  const { api, machine } = useDialogContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'title', present: true })
    return () => machine.send({ type: 'part.presence', part: 'title', present: false })
  }, [machine])

  const merged = mergeProps<DialogTitleProps>(props, normalize(api.parts.title))
  return <h2 {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Description> — the dialog's accessible description
// =============================================================================

export interface DialogDescriptionProps extends ComponentPropsWithoutRef<'div'> {}

export const Description: PartComponent<DialogDescriptionProps, HTMLDivElement> = forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>((props, forwardedRef) => {
  const { api, machine } = useDialogContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'description', present: true })
    return () => machine.send({ type: 'part.presence', part: 'description', present: false })
  }, [machine])

  const merged = mergeProps<DialogDescriptionProps>(props, normalize(api.parts.description))
  return <div {...merged} ref={forwardedRef} />
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
  const merged = mergeProps<DialogCloseProps>(
    { type: 'button', ...props },
    normalize(api.parts.close),
  )
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
