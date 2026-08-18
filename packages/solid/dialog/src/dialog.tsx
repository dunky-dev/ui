import {
  createEffect,
  omit,
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

import { interceptBackNavigation } from '@dunky.dev/dom-navigation'
import {
  getInitialFocus,
  hideExitingLayer,
  isTopmostLayer,
  registerLayer,
  watchExitAnimation,
} from '@dunky.dev/dom-overlay'
import { mergeProps, normalize } from '@dunky.dev/solid-state-machine'
import { DialogContext, useDialogContext } from './context'
import { useDialog } from './use-dialog'

// A part's bindings merge INSIDE the JSX spread: the compiler wraps the
// expression in a reactive scope, so a machine transition re-translates it.
// `children` never rides that spread — a re-evaluated spread re-CREATES the
// children it carries, and a child whose lifecycle writes to the machine
// (Title's presence) would then loop machine -> spread -> remount -> machine.
// Every part strips it and renders `{props.children}` explicitly.

// A consumer ref that crossed a component boundary is a setter function or an
// array of them (Solid 2.0 refs are functions; arrays compose); apply it
// alongside the part's own element capture.
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

  // closeOnBack: while open, a guard entry in the session history turns the
  // host's Back into a dismissal instead of a navigation. Every decision
  // (gate, veto, controlled) lives in the core's backNavigate; this effect
  // only wires the web mechanics. It tracks `api.open` alone — fresh callback
  // identities never churn real session-history entries. It lives on the
  // root — the guard concerns the dialog's openness, not any rendered part.
  createEffect(
    () => api.open,
    open => {
      if (!open || !machine.context.closeOnBack) return
      return interceptBackNavigation(() => {
        untrack(() => api.backNavigate())
        return !machine.matches('open')
      })
    },
  )

  return (
    <DialogContext value={{ api, machine, depth, container: () => null, backdropRef }}>
      {props.children}
    </DialogContext>
  )
}

// =============================================================================
// <Dialog.Trigger> — toggles the dialog; focus returns here on close
// =============================================================================

export interface DialogTriggerProps extends ComponentProps<'button'> {}

export const Trigger: Component<DialogTriggerProps> = props => {
  const { api } = useDialogContext()
  const rest = omit(props, 'children')
  return (
    <button
      {...mergeProps<DialogTriggerProps>({ type: 'button', ...rest }, normalize(api.parts.trigger))}
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
    // `mounted`, not `open`: an animated dialog stays in the tree through
    // `closing` so its exit visual can play before everything unmounts.
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
  const { api, machine, backdropRef } = useDialogContext()
  const rest = omit(props, 'ref', 'children')
  // The shared slot must not outlive the element: the context box lives on
  // the root, the element only until this part's owner disposes.
  onSettled(() => () => (backdropRef.current = null))

  const bindings = (): Record<string, unknown> => {
    const { onClick, ...attrs } = normalize(api.parts.backdrop) as {
      onClick?: (event: MouseEvent) => void
    } & Record<string, unknown>
    return {
      ...attrs,
      // Only the topmost dialog of a stack answers an outside press.
      onClick: (event: MouseEvent) => {
        if (isTopmostLayer(machine.context.id)) onClick?.(event)
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
  const { api, machine } = useDialogContext()
  const rest = omit(props, 'children')

  const bindings = (): Record<string, unknown> => {
    const { onClick, ...attrs } = normalize(api.parts.viewport) as {
      onClick?: (event: MouseEvent) => void
    } & Record<string, unknown>
    return {
      ...attrs,
      // Content presses bubble up here — only a press that started on the
      // viewport itself is an outside interaction, and only the topmost dialog
      // of a stack answers it.
      onClick: (event: MouseEvent) => {
        if (event.target !== event.currentTarget) return
        if (!isTopmostLayer(machine.context.id)) return
        onClick?.(event)
      },
    }
  }

  return <div {...mergeProps<DialogViewportProps>(rest, bindings())}>{props.children}</div>
}

// =============================================================================
// <Dialog.Content> — the dialog window: focus moves in on open, restores on
// close, traps while modal
// =============================================================================

export interface DialogContentProps extends ComponentProps<'div'> {
  /** The element to focus when the dialog opens — an element, or an accessor
   * resolved at open time (the Solid idiom for a ref variable that fills
   * during render). @default the dialog window */
  initialFocus?: HTMLElement | (() => HTMLElement | null | undefined)
}

const resolveInitialFocus = (value: DialogContentProps['initialFocus']): HTMLElement | null =>
  (typeof value === 'function' ? value() : value) ?? null

export const Content: Component<DialogContentProps> = props => {
  const { api, machine, depth, container, backdropRef } = useDialogContext()
  const rest = omit(props, 'ref', 'initialFocus', 'children')
  let contentEl: HTMLDivElement | undefined

  // The machine's `open` state is the edge, not mount/unmount — an animated
  // dialog stays mounted through `closing`, and the stack, containment, and
  // focus must release the moment the exit starts, not when it finishes.
  // One effect keeps the ordering right both ways: the stack joins before focus
  // moves in, and on close it must release the layers beneath (un-inert them)
  // before focus can move back out to one of them. Apply-phase reads go
  // through untrack — `api.open` is the one edge; the options must not re-run
  // the effect.
  createEffect(
    () => api.open,
    open => {
      const content = contentEl
      if (!open || content === undefined) return

      const previous = document.activeElement
      const unregister = registerLayer({
        id: machine.context.id,
        depth,
        element: content,
        modal: machine.context.modal,
        backdrop: () => backdropRef.current,
      })

      // preventScroll everywhere: the scroll lock already froze the surface, so
      // moving focus must not scroll it — otherwise opening jumps the (top-of-
      // container) dialog into view and closing jumps back to the trigger.
      const target =
        untrack(() => resolveInitialFocus(props.initialFocus)) ?? getInitialFocus(content)
      target.focus({ preventScroll: true })
      // A target that can't take focus (disabled, hidden) falls back to the panel.
      if (document.activeElement !== target) content.focus({ preventScroll: true })

      return () => {
        unregister()
        if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
      }
    },
  )

  // The exit window: Content live while not open only happens in `closing`.
  // The layer has already released everything above, so hide the still-painting
  // layer from interaction and report when its visual is done; the cleanup is
  // the reopen interrupt (and final unmount) undoing both.
  createEffect(
    () => api.open,
    open => {
      const content = contentEl
      if (open || content === undefined) return

      const undoHide = untrack(() =>
        hideExitingLayer(content, container() ?? document.body, backdropRef.current),
      )
      const cancelWatch = watchExitAnimation(content, () => machine.send({ type: 'exit.complete' }))
      return () => {
        cancelWatch()
        undoHide()
      }
    },
  )

  // The lock spans the whole mount — through `closing` too: releasing it
  // mid-exit would bring the scrollbar back and reflow the page under the
  // still-painting layer. A scoped dialog locks its portal container; a page
  // dialog locks the body.
  useScrollLock(() => machine.context.modal, container)

  useFocusTrap(() => contentEl ?? null, {
    // Only a modal dialog traps, and only while topmost — a nested dialog
    // owns focus while open.
    enabled: () => machine.context.modal && isTopmostLayer(machine.context.id),
    // The Close part is the cycle's last stop wherever it renders (core
    // SPEC); found by its derived id.
    last: () => document.getElementById(api.ids.close),
  })

  // A neutral element with the role, not <dialog>: the window is the initial
  // focus target, so it carries tabindex — which HTML forbids on <dialog> —
  // and the native element only pays off via showModal(), which this contract
  // deliberately doesn't use.
  return (
    <div
      {...mergeProps<DialogContentProps>(rest, normalize(api.parts.content))}
      ref={element => {
        contentEl = element
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

  // Presence reports from the settled phase: the machine starts on the root's
  // settle, which owner order puts before this one.
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
