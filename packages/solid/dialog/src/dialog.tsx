import {
  createEffect,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
  Show,
  type Component,
  type Ref,
} from 'solid-js'
import { isServer, Portal as HostPortal, type ComponentProps, type JSX } from '@solidjs/web'
import { useFocusTrap } from '@dunky.dev/solid-use-focus-trap'
import { useScrollLock } from '@dunky.dev/solid-use-scroll-lock'
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
import { mergeProps, normalize } from '@dunky.dev/solid-state-machine'
import { DialogContext, useDialogContext } from './context'
import { useDialog } from './use-dialog'

// Bindings merge inside the JSX spread so they stay reactive. `children` must
// never ride that spread: a re-evaluated spread re-creates the children, and a
// child that writes to the machine on mount (Title) would loop forever. Every
// part omits it and renders `{props.children}` explicitly.

// A consumer ref that crossed a component boundary is a function or an array
// of functions.
function applyConsumerRef<T>(ref: Ref<T> | undefined, element: T): void {
  if (typeof ref === 'function') (ref as (element: T) => void)(element)
  else if (Array.isArray(ref)) for (const entry of ref) applyConsumerRef(entry as Ref<T>, element)
}

// =============================================================================
// <Dialog> — root, owns the machine and renders no DOM
// =============================================================================

export interface DialogProps extends DialogOptions {
  children?: JSX.Element
}

export const Dialog: Component<DialogProps> & Parts = props => {
  const options = omit(props, 'children')
  // Nesting derives from the parent dialog's context (null = top-level).
  const depth = (useContext(DialogContext)?.depth ?? 0) + 1
  const { api, machine } = useDialog(options)
  const backdropRef: { current: HTMLDivElement | null } = { current: null }
  const contentRef: { current: HTMLDivElement | null } = { current: null }
  const triggerRef: { current: HTMLButtonElement | null } = { current: null }
  const pressOriginRef: { current: (() => boolean) | null } = { current: null }

  // The guard lives on the root — it concerns the dialog's openness, not any
  // rendered part. It spans more than the open state, so it can't be this
  // effect's cleanup: a Back-close leaves the registration parked for the
  // Forward that may reopen it, and only disposal ends the episode outright.
  let guard: BackNavigationGuard | null = null

  createEffect(
    () => api.open,
    open => {
      if (!machine.context.closeOnBack) return
      guard ??= guardBackNavigation({
        backNavigate: () => untrack(() => api.backNavigate()),
        forwardNavigate: () => untrack(() => api.forwardNavigate()),
        isOpen: () => machine.matches('open'),
        depth,
      })
      guard.sync(open)
    },
  )

  onCleanup(() => {
    guard?.release()
    guard = null
  })

  return (
    <DialogContext
      value={{
        api,
        machine,
        depth,
        container: () => null,
        backdropRef,
        contentRef,
        triggerRef,
        pressOriginRef,
      }}
    >
      {props.children}
    </DialogContext>
  )
}

// =============================================================================
// <Dialog.Trigger> — toggles the dialog; focus returns here on close
// =============================================================================

export interface DialogTriggerProps extends ComponentProps<'button'> {}

export const Trigger: Component<DialogTriggerProps> = props => {
  const { api, triggerRef } = useDialogContext()
  const rest = omit(props, 'ref', 'children')
  onSettled(() => () => (triggerRef.current = null))
  return (
    <button
      {...mergeProps<DialogTriggerProps>({ type: 'button', ...rest }, normalize(api.parts.trigger))}
      ref={element => {
        triggerRef.current = element
        applyConsumerRef(props.ref, element)
      }}
    >
      {props.children}
    </button>
  )
}

// =============================================================================
// <Dialog.Portal> — teleports the layers out of the tree while open
// =============================================================================

export interface DialogPortalProps {
  children?: JSX.Element
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal: Component<DialogPortalProps> = props => {
  const context = useDialogContext()
  if (isServer) return null
  return (
    // `mounted`, not `open`: an animated dialog stays mounted through
    // `closing` so its exit visual can play.
    <Show when={context.api.mounted}>
      {/* keyed: the host portal's mount is fixed at creation, so a container
          swap re-creates the portal on the new target. */}
      <Show when={props.container ?? document.body} keyed>
        {mount => (
          <HostPortal mount={mount}>
            {/* Re-provide the context with the scoped container (null = page
                body) so Content locks the right scroll surface. */}
            <DialogContext value={{ ...context, container: () => props.container ?? null }}>
              {props.children}
            </DialogContext>
          </HostPortal>
        )}
      </Show>
    </Show>
  )
}

// =============================================================================
// <Dialog.Backdrop> — the layer behind the dialog window
// =============================================================================

export interface DialogBackdropProps extends ComponentProps<'div'> {}

export const Backdrop: Component<DialogBackdropProps> = props => {
  const { api, machine, backdropRef, pressOriginRef } = useDialogContext()
  const rest = omit(props, 'ref', 'children')
  onSettled(() => () => (backdropRef.current = null))

  const bindings = (): Record<string, unknown> => {
    const { onClick, ...attrs } = normalize(api.parts.backdrop) as {
      onClick?: (event: MouseEvent) => void
    } & Record<string, unknown>
    return {
      ...attrs,
      onClick: (event: MouseEvent) => {
        if (acceptsBackdropPress(machine.context.id, pressOriginRef.current?.() ?? false))
          onClick?.(event)
      },
    }
  }

  return (
    // Only a modal dialog dims the page — non-modal coexists with it.
    <Show when={machine.context.modal}>
      <div
        {...mergeProps<DialogBackdropProps>(rest, bindings())}
        ref={element => {
          backdropRef.current = element
          applyConsumerRef(props.ref, element)
        }}
      >
        {props.children}
      </div>
    </Show>
  )
}

// =============================================================================
// <Dialog.Viewport> — the positioning + scroll layer around the dialog window
// =============================================================================

export interface DialogViewportProps extends ComponentProps<'div'> {}

export const Viewport: Component<DialogViewportProps> = props => {
  const { api, machine, contentRef, triggerRef, pressOriginRef } = useDialogContext()
  const rest = omit(props, 'style', 'children')

  const bindings = (): Record<string, unknown> => {
    const { onClick, ...attrs } = normalize(api.parts.viewport) as {
      onClick?: (event: MouseEvent) => void
    } & Record<string, unknown>
    return {
      ...attrs,
      onClick: (event: MouseEvent) => {
        if (acceptsViewportPress(machine.context.id, event, pressOriginRef.current?.() ?? false))
          onClick?.(event)
      },
    }
  }

  // Non-modal: the Viewport's own pointer-events are off (see the style
  // below), so it never receives a press on the empty area to detect as
  // outside — the document is the only vantage point left.
  createEffect(
    () => api.open,
    open => {
      if (!open || machine.context.modal) return
      const content = contentRef.current
      if (content === null) return
      return watchOutsidePress(machine.context.id, {
        element: content,
        trigger: triggerRef.current,
        startedInside: () => pressOriginRef.current?.() ?? false,
        onOutsidePress: event =>
          untrack(() => {
            const { onClick } = normalize(api.parts.viewport) as {
              onClick?: (event: MouseEvent) => void
            }
            onClick?.(event)
          }),
      })
    },
  )

  return (
    <div
      {...mergeProps<DialogViewportProps>(rest, bindings())}
      // Non-modal: the page coexists with the dialog, so the empty area
      // around the window must let presses fall through rather than swallow
      // them.
      style={withPointerEvents(props.style, viewportPointerEvents(machine.context.modal))}
    >
      {props.children}
    </div>
  )
}

// =============================================================================
// <Dialog.Content> — the dialog window: focus moves in on open, restores on
// close, traps while modal
// =============================================================================

export interface DialogContentProps extends ComponentProps<'div'> {
  /** The element to focus when the dialog opens — an element, or an accessor
   * resolved at open time. @default the dialog window */
  initialFocus?: HTMLElement | (() => HTMLElement | null | undefined)
}

const resolveInitialFocus = (value: DialogContentProps['initialFocus']): HTMLElement | null =>
  (typeof value === 'function' ? value() : value) ?? null

// The consumer's own style wins over the pointer-events default; a string
// style keeps the default as the earlier (overridable) declaration.
const withPointerEvents = (
  style: ComponentProps<'div'>['style'],
  value: 'none' | 'auto' | undefined,
): ComponentProps<'div'>['style'] => {
  if (value === undefined) return style
  if (typeof style === 'string') return `pointer-events:${value};${style}`
  if (typeof style === 'object' && style !== null) return { 'pointer-events': value, ...style }
  return { 'pointer-events': value }
}

export const Content: Component<DialogContentProps> = props => {
  const { api, machine, depth, container, backdropRef, contentRef, pressOriginRef } =
    useDialogContext()
  const rest = omit(props, 'ref', 'initialFocus', 'style', 'children')
  onSettled(() => () => (contentRef.current = null))

  // The `open` state is the edge, not mount/unmount: an animated dialog stays
  // mounted through `closing`. The sequence and its inverse are the DOM
  // package's; this effect only ties them to Solid's lifecycle.
  createEffect(
    () => api.open,
    open => {
      const content = contentRef.current
      if (!open || content === null) return

      const releaseLayer = openDialogLayer(content, {
        id: machine.context.id,
        depth,
        modal: machine.context.modal,
        backdrop: () => backdropRef.current,
        initialFocus: untrack(() => resolveInitialFocus(props.initialFocus)),
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
    },
  )

  // Mounted while not open only happens in `closing`.
  createEffect(
    () => api.open,
    open => {
      const content = contentRef.current
      if (open || content === null) return

      return untrack(() =>
        startExitWindow(content, {
          container: container(),
          backdrop: backdropRef.current,
          onComplete: () => machine.send({ type: 'exit.complete' }),
        }),
      )
    },
  )

  // The lock spans the whole mount — through `closing` too: releasing it
  // mid-exit would reflow the page under the still-painting layer. The
  // context's `null` means "page body", not the hook's "no target yet" —
  // map it to the hook's body default.
  useScrollLock(
    () => machine.context.modal,
    () => container() ?? undefined,
  )

  useFocusTrap(
    () => contentRef.current,
    dialogTrapOptions(machine, () => api.ids.close),
  )

  // A neutral element with the role, not <dialog>: the window carries
  // tabindex (forbidden on <dialog>), and this contract doesn't use
  // showModal() — see SPEC.md.
  return (
    <div
      {...mergeProps<DialogContentProps>(rest, normalize(api.parts.content))}
      // Always interactive, even where a non-modal Viewport disables pointer
      // events to let presses fall through around it.
      style={withPointerEvents(props.style, contentPointerEvents)}
      ref={element => {
        contentRef.current = element
        applyConsumerRef(props.ref, element)
      }}
    >
      {props.children}
    </div>
  )
}

// =============================================================================
// <Dialog.Title> — the dialog's accessible name
// =============================================================================

export interface DialogTitleProps extends ComponentProps<'h2'> {}

export const Title: Component<DialogTitleProps> = props => {
  const { api, machine } = useDialogContext()
  const rest = omit(props, 'children')

  // onSettled: the machine starts on the root's settle, which runs first.
  onSettled(() => {
    machine.send({ type: 'part.presence', part: 'title', present: true })
    return () => machine.send({ type: 'part.presence', part: 'title', present: false })
  })

  return (
    <h2 {...mergeProps<DialogTitleProps>(rest, normalize(api.parts.title))}>{props.children}</h2>
  )
}

// =============================================================================
// <Dialog.Description> — the dialog's accessible description
// =============================================================================

export interface DialogDescriptionProps extends ComponentProps<'div'> {}

export const Description: Component<DialogDescriptionProps> = props => {
  const { api, machine } = useDialogContext()
  const rest = omit(props, 'children')

  onSettled(() => {
    machine.send({ type: 'part.presence', part: 'description', present: true })
    return () => machine.send({ type: 'part.presence', part: 'description', present: false })
  })

  return (
    <div {...mergeProps<DialogDescriptionProps>(rest, normalize(api.parts.description))}>
      {props.children}
    </div>
  )
}

// =============================================================================
// <Dialog.Close> — the visible in-dialog close affordance
// =============================================================================

export interface DialogCloseProps extends ComponentProps<'button'> {}

export const Close: Component<DialogCloseProps> = props => {
  const { api } = useDialogContext()
  const rest = omit(props, 'children')
  return (
    <button
      {...mergeProps<DialogCloseProps>({ type: 'button', ...rest }, normalize(api.parts.close))}
    >
      {props.children}
    </button>
  )
}

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
