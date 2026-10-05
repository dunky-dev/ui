import {
  Teleport,
  defineComponent,
  effectScope,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onScopeDispose,
  onUnmounted,
  provide,
  shallowRef,
  toValue,
  watch,
  type ButtonHTMLAttributes,
  type ComponentInternalInstance,
  type ComponentOptionsMixin,
  type DefineComponent,
  type EffectScope,
  type EmitsOptions,
  type HTMLAttributes,
  type MaybeRefOrGetter,
  type PropType,
} from 'vue'
import { useFocusTrap } from '@dunky.dev/vue-use-focus-trap'
import { useScrollLock } from '@dunky.dev/vue-use-scroll-lock'
import type {
  DialogCallbacks,
  DialogEscapeScope,
  DialogOptions,
  DialogRole,
} from '@dunky.dev/dialog'

import {
  acceptsBackdropPress,
  acceptsViewportPress,
  dialogTrapOptions,
  guardBackNavigation,
  openDialogLayer,
  startExitWindow,
  type BackNavigationGuard,
} from '@dunky.dev/dom-dialog'
import { mergeProps, normalize } from '@dunky.dev/vue-state-machine'
import { DialogContextKey, useDialogContext } from './context'
import { useDialog } from './use-dialog'

// Explicit so the exports satisfy --isolatedDeclarations (a bare
// defineComponent call gives the variable no annotatable type). It is the
// options-carrying type an SFC gets: the function-signature defineComponent
// types its result as a bare constructor, which tooling built around SFCs
// (Storybook's Meta) rejects — the value is the same options object either
// way, so the casts below only name it.
type DialogComponent<Props, Emits extends EmitsOptions = {}> = DefineComponent<
  Props,
  {},
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  Emits
>

// Vue casts an absent Boolean prop to `false`; `default: undefined` keeps it
// absent, so the core's defaults (`modal` true) and the controlled contract
// (`open` absent = uncontrolled) hold.
const booleanOption = { type: Boolean, default: undefined }

// Whether the component sits in a <KeepAlive> view that is deactivated: async
// data can mount a dialog into a cached view after the user left it, and its
// DOM then waits in the cache for the view's return.
function inDeactivatedView(instance: ComponentInternalInstance | null): boolean {
  for (let node = instance; node !== null; node = node.parent) {
    if (node.isDeactivated) return true
  }
  return false
}

// Runs `effects` in a scope that lives while the component is mounted and
// active. A <KeepAlive> deactivation ends it like an unmount — the adapter
// pauses the machine the same way, as React's <Activity> runs its effect
// cleanups — and reactivation runs it again, once the flush that restores the
// view is done: a Portal re-enables its teleport in that flush, and the
// layer has to be back in place before its sequences run. Mounted hooks
// never run during server rendering, so neither does it.
function whileActive(effects: () => void): void {
  const instance = getCurrentInstance()
  let scope: EffectScope | undefined
  let active = false
  const start = (): void => {
    if (!active || scope !== undefined) return
    scope = effectScope()
    scope.run(effects)
  }
  const stop = (): void => {
    active = false
    scope?.stop()
    scope = undefined
  }
  onMounted(() => {
    active = !inDeactivatedView(instance)
    start()
  })
  // Also fires on a kept-alive first mount, after `onMounted` already started.
  onActivated(() => {
    active = true
    void nextTick(start)
  })
  onDeactivated(stop)
  onBeforeUnmount(stop)
}

// =============================================================================
// <Dialog> — root, owns the machine and renders no DOM
// =============================================================================

/** The core options; the core callbacks are the emits (`DialogEmits`). */
export interface DialogProps extends Omit<DialogOptions, keyof DialogCallbacks> {}

type Payload<Callback extends keyof DialogCallbacks> = Parameters<
  NonNullable<DialogCallbacks[Callback]>
>

/** The core callbacks as emits, listeners called synchronously — so
 * `preventDefault()` on a dismissal payload still vetoes it. */
export type DialogEmits = {
  /** Fired on every open/close transition with the new value; with the `open`
   * prop it forms `v-model:open`. */
  'update:open': (open: boolean) => void
  /** Fired before an Escape dismissal; `preventDefault()` vetoes it. */
  escapeKeyDown: (...event: Payload<'onEscapeKeyDown'>) => void
  /** Fired before an outside-press dismissal; `preventDefault()` vetoes it. */
  interactOutside: (...event: Payload<'onInteractOutside'>) => void
  /** Fired before a back-navigation dismissal; `preventDefault()` vetoes it. */
  backNavigation: (...event: Payload<'onBackNavigation'>) => void
  /** Fired before a forward-navigation reopen; `preventDefault()` vetoes it. */
  forwardNavigation: (...event: Payload<'onForwardNavigation'>) => void
}

const DialogRoot = defineComponent<DialogProps, DialogEmits>(
  (props, { emit, slots }) => {
    // Nesting derives from the parent dialog's context (null = top-level).
    const depth = (inject(DialogContextKey, null)?.depth ?? 0) + 1
    // Built once: a fresh forwarder per read would re-run the effects keyed on
    // a callback (the Escape listener) on every prop change.
    const callbacks: DialogCallbacks = {
      onOpenChange: open => emit('update:open', open),
      onEscapeKeyDown: event => emit('escapeKeyDown', event),
      onInteractOutside: event => emit('interactOutside', event),
      onBackNavigation: event => emit('backNavigation', event),
      onForwardNavigation: event => emit('forwardNavigation', event),
    }
    const { api, machine } = useDialog(() => ({ ...props, ...callbacks }))
    const backdropRef = shallowRef<HTMLElement | null>(null)

    provide(DialogContextKey, { api, machine, depth, container: () => null, backdropRef })

    // The guard lives on the root — it concerns the dialog's openness, not any
    // rendered part. It spans more than the open state, so it can't be the
    // watcher's cleanup: a Back-close leaves the registration parked for the
    // Forward that may reopen it, and only the scope's end — an unmount or a
    // deactivation — ends the episode outright.
    let guard: BackNavigationGuard | null = null

    whileActive(() => {
      watch(
        () => api.value.open,
        open => {
          if (!machine.context.closeOnBack) return
          guard ??= guardBackNavigation({
            backNavigate: () => api.value.backNavigate(),
            forwardNavigate: () => api.value.forwardNavigate(),
            isOpen: () => machine.matches('open'),
            depth,
          })
          guard.sync(open)
        },
        { immediate: true, flush: 'post' },
      )
      onScopeDispose(() => {
        guard?.release()
        guard = null
      })
    })

    return () => slots.default?.()
  },
  {
    name: 'Dialog',
    // Renders no element of its own: an attribute would otherwise fall
    // through to whichever single part happens to render.
    inheritAttrs: false,
    props: {
      id: { type: String, default: undefined },
      open: booleanOption,
      defaultOpen: booleanOption,
      modal: booleanOption,
      role: { type: String as PropType<DialogRole>, default: undefined },
      closeOnEscape: booleanOption,
      escapeScope: { type: String as PropType<DialogEscapeScope>, default: undefined },
      closeOnInteractOutside: booleanOption,
      closeOnBack: booleanOption,
      animated: booleanOption,
    },
    emits: [
      'update:open',
      'escapeKeyDown',
      'interactOutside',
      'backNavigation',
      'forwardNavigation',
    ],
  },
) as DialogComponent<DialogProps, DialogEmits>

// =============================================================================
// <Dialog.Trigger> — toggles the dialog; focus returns here on close
// =============================================================================

export interface DialogTriggerProps extends ButtonHTMLAttributes {}

export const Trigger: DialogComponent<DialogTriggerProps> = defineComponent(
  (_props: DialogTriggerProps, { attrs, slots }) => {
    const { api } = useDialogContext()
    return () =>
      h(
        'button',
        mergeProps({ type: 'button', ...attrs }, normalize(api.value.parts.trigger)),
        slots.default?.(),
      )
  },
  { name: 'DialogTrigger', inheritAttrs: false },
) as DialogComponent<DialogTriggerProps>

// =============================================================================
// <Dialog.Portal> — teleports the layers out of the tree while open
// =============================================================================

export interface DialogPortalProps {
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal: DialogComponent<DialogPortalProps> = defineComponent(
  (props: DialogPortalProps, { slots }) => {
    const context = useDialogContext()
    // Re-provide the context with the scoped container (null = page body) so
    // Content locks the right scroll surface.
    provide(DialogContextKey, { ...context, container: () => props.container ?? null })

    // The server has no document to teleport into, so it renders no portal —
    // and the client's hydration pass must render the same: the teleport
    // arrives with the first update after mount.
    const mounted = shallowRef(false)
    // A <KeepAlive> deactivation parks the layers back in place, inside the
    // cached subtree and off the document — Vue would leave teleported
    // content painted over the next view while the machine behind it is
    // paused. Disabling, not unmounting, keeps their state for reactivation.
    const active = shallowRef(true)
    const instance = getCurrentInstance()
    onMounted(() => {
      mounted.value = true
      active.value = !inDeactivatedView(instance)
    })
    onActivated(() => {
      active.value = true
    })
    onDeactivated(() => {
      active.value = false
    })

    // A container swap re-creates the teleport instead of moving it, like
    // React's and Solid's portals: a moved window drops focus, and its
    // containment was computed for the old placement.
    let generation = 0
    watch(
      () => props.container ?? null,
      () => {
        generation++
      },
    )

    return () => {
      // `mounted`, not `open`: an animated dialog stays in the tree through
      // `closing` so its exit visual can play before everything unmounts.
      if (!mounted.value || !context.api.value.mounted) return null
      return h(
        Teleport,
        { key: generation, to: props.container ?? document.body, disabled: !active.value },
        slots.default?.() ?? [],
      )
    }
  },
  { name: 'DialogPortal', inheritAttrs: false, props: ['container'] },
) as DialogComponent<DialogPortalProps>

// =============================================================================
// <Dialog.Backdrop> — the layer behind the dialog window
// =============================================================================

export interface DialogBackdropProps extends HTMLAttributes {}

export const Backdrop: DialogComponent<DialogBackdropProps> = defineComponent(
  (_props: DialogBackdropProps, { attrs, slots }) => {
    const { api, machine, backdropRef } = useDialogContext()
    return () => {
      // Only a modal dialog dims the page — non-modal coexists with it.
      if (!machine.context.modal) return null

      const { onClick, ...bindings } = normalize(api.value.parts.backdrop) as {
        onClick?: (event: MouseEvent) => void
      } & Record<string, unknown>

      const merged = mergeProps(attrs, {
        ...bindings,
        onClick: (event: MouseEvent) => {
          if (acceptsBackdropPress(machine.context.id)) onClick?.(event)
        },
      })

      return h('div', { ...merged, ref: backdropRef }, slots.default?.())
    }
  },
  { name: 'DialogBackdrop', inheritAttrs: false },
) as DialogComponent<DialogBackdropProps>

// =============================================================================
// <Dialog.Viewport> — the positioning + scroll layer around the dialog window
// =============================================================================

export interface DialogViewportProps extends HTMLAttributes {}

export const Viewport: DialogComponent<DialogViewportProps> = defineComponent(
  (_props: DialogViewportProps, { attrs, slots }) => {
    const { api, machine } = useDialogContext()
    return () => {
      const { onClick, ...bindings } = normalize(api.value.parts.viewport) as {
        onClick?: (event: MouseEvent) => void
      } & Record<string, unknown>

      const merged = mergeProps(attrs, {
        ...bindings,
        onClick: (event: MouseEvent) => {
          if (acceptsViewportPress(machine.context.id, event)) onClick?.(event)
        },
      })

      return h('div', merged, slots.default?.())
    }
  },
  { name: 'DialogViewport', inheritAttrs: false },
) as DialogComponent<DialogViewportProps>

// =============================================================================
// <Dialog.Content> — the dialog window: focus moves in on open, restores on
// close, traps while modal
// =============================================================================

/** An element, a ref to one, or a getter — resolved when the dialog reads it. */
type FocusTarget = MaybeRefOrGetter<HTMLElement | null | undefined>

export interface DialogContentProps extends HTMLAttributes {
  /** The element to focus when the dialog opens — resolved at open time, so a
   * template ref that fills after setup works. @default the dialog window */
  initialFocus?: FocusTarget
  /** Focused on close when nothing meaningful held focus before opening — it
   * sat on the body (a pointer press leaves it there) or on an element since
   * removed. Resolved at close time. Typically the dialog's trigger. */
  restoreFocus?: FocusTarget
}

export const Content: DialogComponent<DialogContentProps> = defineComponent(
  (props: DialogContentProps, { attrs, slots }) => {
    const { api, machine, depth, container, backdropRef } = useDialogContext()
    const contentRef = shallowRef<HTMLElement | null>(null)

    // The machine's state is the edge, not mount/unmount: an animated dialog
    // stays mounted through `closing`, its exit window, and a Content rendered
    // with the root (no Portal) is mounted while closed too. The sequences
    // and their inverses are the DOM package's; this watcher only ties them
    // to Vue's lifecycle, once the element exists. Released by hand rather
    // than through the watcher's onCleanup, which Vue 3.6 also runs when the
    // source merely re-evaluates.
    whileActive(() => {
      let release: (() => void) | undefined
      watch(
        () => (api.value.open ? 'open' : api.value.mounted ? 'closing' : 'closed'),
        state => {
          release?.()
          release = undefined
          const content = contentRef.value
          if (content === null || state === 'closed') return

          release =
            state === 'open'
              ? openDialogLayer(content, {
                  id: machine.context.id,
                  depth,
                  modal: machine.context.modal,
                  backdrop: () => backdropRef.value,
                  initialFocus: toValue(props.initialFocus),
                  restoreFocus: () => toValue(props.restoreFocus) ?? null,
                  dismiss: () => machine.send({ type: 'close' }),
                })
              : startExitWindow(content, {
                  container: container(),
                  backdrop: backdropRef.value,
                  onComplete: () => machine.send({ type: 'exit.complete' }),
                })
        },
        // `post`: the sequences must see the DOM the new state renders — a
        // stylesheet may hide a closed window — as a React effect runs after
        // commit.
        { immediate: true, flush: 'post' },
      )
      onScopeDispose(() => release?.())
    })

    // The lock spans the whole mount — through `closing` too: releasing it
    // mid-exit would bring the scrollbar back and reflow the page under the
    // still-painting layer. The context's `null` means "page body", not the
    // hook's "no target yet" — name the body. Read on mount, client-side.
    useScrollLock(machine.context.modal, () => container() ?? document.body)

    useFocusTrap(
      contentRef,
      dialogTrapOptions(machine, () => api.value.ids.close),
    )

    // A neutral element with the role, not <dialog>: the window carries
    // tabindex (forbidden on <dialog>), and this contract doesn't use
    // showModal() — see SPEC.md.
    return () =>
      h(
        'div',
        { ...mergeProps(attrs, normalize(api.value.parts.content)), ref: contentRef },
        slots.default?.(),
      )
  },
  { name: 'DialogContent', inheritAttrs: false, props: ['initialFocus', 'restoreFocus'] },
) as DialogComponent<DialogContentProps>

// =============================================================================
// <Dialog.Title> — the dialog's accessible name
// =============================================================================

export interface DialogTitleProps extends HTMLAttributes {}

export const Title: DialogComponent<DialogTitleProps> = defineComponent(
  (_props: DialogTitleProps, { attrs, slots }) => {
    const { api, machine } = useDialogContext()

    // A part mounted with the root mounts before the root starts the machine
    // (children mount first); the stopped machine still records it.
    onMounted(() => machine.send({ type: 'part.presence', part: 'title', present: true }))
    onUnmounted(() => machine.send({ type: 'part.presence', part: 'title', present: false }))

    return () => h('h2', mergeProps(attrs, normalize(api.value.parts.title)), slots.default?.())
  },
  { name: 'DialogTitle', inheritAttrs: false },
) as DialogComponent<DialogTitleProps>

// =============================================================================
// <Dialog.Description> — the dialog's accessible description
// =============================================================================

export interface DialogDescriptionProps extends HTMLAttributes {}

export const Description: DialogComponent<DialogDescriptionProps> = defineComponent(
  (_props: DialogDescriptionProps, { attrs, slots }) => {
    const { api, machine } = useDialogContext()

    onMounted(() => machine.send({ type: 'part.presence', part: 'description', present: true }))
    onUnmounted(() => machine.send({ type: 'part.presence', part: 'description', present: false }))

    return () =>
      h('div', mergeProps(attrs, normalize(api.value.parts.description)), slots.default?.())
  },
  { name: 'DialogDescription', inheritAttrs: false },
) as DialogComponent<DialogDescriptionProps>

// =============================================================================
// <Dialog.Close> — the visible in-dialog close affordance
// =============================================================================

export interface DialogCloseProps extends ButtonHTMLAttributes {}

export const Close: DialogComponent<DialogCloseProps> = defineComponent(
  (_props: DialogCloseProps, { attrs, slots }) => {
    const { api } = useDialogContext()
    return () =>
      h(
        'button',
        mergeProps({ type: 'button', ...attrs }, normalize(api.value.parts.close)),
        slots.default?.(),
      )
  },
  { name: 'DialogClose', inheritAttrs: false },
) as DialogComponent<DialogCloseProps>

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

export const Dialog: DialogComponent<DialogProps, DialogEmits> & Parts = Object.assign(DialogRoot, {
  Trigger,
  Portal,
  Backdrop,
  Viewport,
  Content,
  Title,
  Description,
  Close,
})
