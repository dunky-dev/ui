import {
  Teleport,
  computed,
  defineComponent,
  effectScope,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onActivated,
  onDeactivated,
  onMounted,
  onScopeDispose,
  onUnmounted,
  onUpdated,
  provide,
  shallowRef,
  toValue,
  watch,
  type ButtonHTMLAttributes,
  type ComponentOptionsMixin,
  type ComponentPublicInstance,
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

// The options-carrying type an SFC gets: the function-signature
// defineComponent infers a bare constructor, which tooling built around SFCs
// (Storybook's Meta) rejects. The value is the same options object either
// way, so each part's cast only names it — and gives the export the explicit
// type --isolatedDeclarations needs.
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

// The instance fields the walk reads, structurally: Vue 3.6 types the chain
// as its Vapor-aware generic instance.
interface InstanceNode {
  isDeactivated: boolean
  parent: InstanceNode | null
}

// Whether the component sits in a deactivated <KeepAlive> view: async data
// can mount a dialog into a cached view after the user left it.
function inDeactivatedView(instance: InstanceNode | null): boolean {
  for (let node = instance; node !== null; node = node.parent) {
    if (node.isDeactivated) return true
  }
  return false
}

// Runs `effects` in a scope that lives while the component is mounted and its
// view active. A <KeepAlive> deactivation ends it like an unmount — the
// adapter pauses the machine the same way, as React's <Activity> runs its
// effect cleanups. Released after the DOM is gone and children first, as
// React runs cleanups after commit: a parent closing over an open child must
// not restore focus into a layer that is still registered above it. Mounted
// hooks never run during server rendering, so neither does this.
function whileActive(effects: () => void): void {
  const instance = getCurrentInstance()
  let scope: EffectScope | undefined
  const start = (): void => {
    if (scope !== undefined) return
    // Detached: the component scope stops before the DOM is removed, parent
    // first — the release order above needs the unmounted hook instead.
    scope = effectScope(true)
    scope.run(effects)
  }
  const stop = (): void => {
    scope?.stop()
    scope = undefined
  }
  onMounted(() => {
    if (!inDeactivatedView(instance)) start()
  })
  // Also fires on a kept-alive first mount, after `onMounted` already started.
  onActivated(start)
  onDeactivated(stop)
  onUnmounted(stop)
}

// <KeepAlive> runs a restored view's activated hooks children first, yet a
// nested stack must reopen outermost first, as it first opened: each layer
// joins the stack over the one beneath and takes focus from it. Placements
// wait out the flush that re-enables the teleports, then run by depth.
const pendingPlacements: Array<{ depth: number; place: () => void }> = []

function placeByDepth(depth: number, place: () => void): void {
  if (pendingPlacements.length === 0) {
    void nextTick(() => {
      const batch = pendingPlacements.splice(0)
      batch.sort((a, b) => a.depth - b.depth)
      for (const entry of batch) entry.place()
    })
  }
  pendingPlacements.push({ depth, place })
}

// A template ref on a component holds its instance; the element is its `$el`.
function toElement(
  target: HTMLElement | ComponentPublicInstance | null | undefined,
): HTMLElement | null {
  const element = target instanceof HTMLElement ? target : target?.$el
  return element instanceof HTMLElement ? element : null
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

    provide(DialogContextKey, {
      api,
      machine,
      depth,
      container: () => null,
      portalled: false,
      backdropRef,
    })

    // The guard lives on the root — it concerns the dialog's openness, not any
    // rendered part. It spans more than the open state, so it can't be the
    // watcher's cleanup: a Back-close leaves the registration parked for the
    // Forward that may reopen it, and only the scope's end — an unmount or a
    // deactivation — ends the episode outright.
    if (machine.context.closeOnBack) {
      let guard: BackNavigationGuard | null = null
      whileActive(() => {
        watch(
          () => api.value.open,
          open => {
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
    }

    return () => slots.default?.()
  },
  {
    name: 'Dialog',
    // Renders no element of its own: an attribute would otherwise fall
    // through to whichever single part happens to render.
    inheritAttrs: false,
    props: {
      id: String,
      open: booleanOption,
      defaultOpen: booleanOption,
      modal: booleanOption,
      role: String as PropType<DialogRole>,
      closeOnEscape: booleanOption,
      escapeScope: String as PropType<DialogEscapeScope>,
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

export const Trigger = defineComponent(
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

export const Portal = defineComponent(
  (props: DialogPortalProps, { slots }) => {
    const context = useDialogContext()
    // Re-provide the context with the scoped container (null = page body) so
    // Content locks the right scroll surface.
    provide(DialogContextKey, {
      ...context,
      container: () => props.container ?? null,
      portalled: true,
    })

    // The server has no document to teleport into, so it renders no portal —
    // and the client's hydration pass must render the same: the teleport
    // arrives with the first update after mount. While the view is
    // deactivated by <KeepAlive>, the teleport is disabled: Vue parks the
    // layers back in place, in the cached view and off the document, instead
    // of leaving them painted over the next view — with their state intact.
    const ready = shallowRef(false)
    const active = shallowRef(true)
    const instance = getCurrentInstance()
    onMounted(() => {
      ready.value = true
      active.value = !inDeactivatedView(instance)
    })
    onActivated(() => {
      active.value = true
    })
    onDeactivated(() => {
      active.value = false
    })

    // `mounted`, not `open`: an animated dialog stays in the tree through
    // `closing` so its exit visual can play before everything unmounts. A
    // computed, so the portal re-renders when that flips, not on every change.
    const mounted = computed(() => context.api.value.mounted)

    // A container swap re-creates the teleport instead of moving it, like
    // React's and Solid's portals: a moved window drops focus, and its
    // containment was computed for the old placement.
    let generation = 0
    watch(
      () => props.container ?? document.body,
      () => {
        generation++
      },
    )

    return () => {
      if (!ready.value || !mounted.value) return null
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

export const Backdrop = defineComponent(
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

export const Viewport = defineComponent(
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

/** An element, a component, a ref to either, or a getter — resolved when the
 * dialog reads it. A component counts as its root element (`$el`). */
type FocusTarget = MaybeRefOrGetter<HTMLElement | ComponentPublicInstance | null | undefined>

// What the window's DOM shows: `closing` is an animated dialog's exit window.
type WindowState = 'open' | 'closing' | 'closed'

export interface DialogContentProps extends HTMLAttributes {
  /** The element to focus when the dialog opens — resolved at open time, so a
   * template ref that fills after setup works. @default the dialog window */
  initialFocus?: FocusTarget
  /** Focused on close when nothing meaningful held focus before opening — it
   * sat on the body (a pointer press leaves it there) or on an element since
   * removed. Resolved at close time. Typically the dialog's trigger. */
  restoreFocus?: FocusTarget
}

export const Content = defineComponent(
  (props: DialogContentProps, { attrs, slots }) => {
    const { api, machine, depth, container, portalled, backdropRef } = useDialogContext()
    const contentRef = shallowRef<HTMLElement | null>(null)

    // The state the window's DOM shows, committed by the hooks that follow its
    // render. The machine can run ahead of the DOM: a change made in a
    // post-flush job (the adapter syncs a controlled `open` there) reaches a
    // `post` watcher before the render it queued. The sequences must see what
    // the state rendered — a stylesheet may hide a closed window — as a React
    // effect runs after commit.
    let rendered: WindowState = 'closed'
    const shown = shallowRef<WindowState>('closed')

    // Whether the window is where it renders: back from a <KeepAlive> cache it
    // is still parked until the Portal re-enables its teleport, in the flush
    // that restores the view — so the sequences wait that flush out.
    const placed = shallowRef(true)
    const instance = getCurrentInstance()
    onMounted(() => {
      shown.value = rendered
      placed.value = !inDeactivatedView(instance)
    })
    onUpdated(() => {
      shown.value = rendered
    })
    onDeactivated(() => {
      placed.value = false
    })
    onActivated(() => {
      placeByDepth(depth, () => {
        placed.value = true
      })
    })

    // The rendered state is the edge, not mount/unmount: an animated dialog
    // stays mounted through `closing`, its exit window, and a Content rendered
    // with the root (no Portal) is mounted while closed too. A portalled
    // window never renders `closed` — it unmounts, and the scope's end
    // releases it once the DOM is gone. The sequences and their inverses are
    // the DOM package's; this watcher only ties them to Vue's lifecycle.
    // Released by hand: Vue 3.6 also runs a watcher's onCleanup when its
    // source merely re-evaluates.
    whileActive(() => {
      let release: (() => void) | undefined
      watch(
        [shown, placed],
        ([state, isPlaced]) => {
          release?.()
          release = undefined
          const content = contentRef.value
          if (content === null || !isPlaced || state === 'closed') return

          release =
            state === 'open'
              ? openDialogLayer(content, {
                  id: machine.context.id,
                  depth,
                  modal: machine.context.modal,
                  backdrop: () => backdropRef.value,
                  initialFocus: toElement(toValue(props.initialFocus)),
                  restoreFocus: () => toElement(toValue(props.restoreFocus)),
                  dismiss: () => machine.send({ type: 'close' }),
                })
              : startExitWindow(content, {
                  // Without a Portal the window sits in the page itself: the
                  // exit hides the window, not its outermost ancestor.
                  container: portalled ? container() : content.parentElement,
                  backdrop: backdropRef.value,
                  onComplete: () => machine.send({ type: 'exit.complete' }),
                })
        },
        // `sync`: both sources change only in the hooks above, which already
        // run once the DOM is in place.
        { immediate: true, flush: 'sync' },
      )
      onScopeDispose(() => release?.())
    })

    // The lock spans the dialog's occupancy — through `closing` too:
    // releasing it mid-exit would bring the scrollbar back and reflow the page
    // under the still-painting layer. The context's `null` means "page body",
    // which the hook needs named.
    useScrollLock(
      () => machine.context.modal && api.value.mounted,
      () => container() ?? document.body,
    )

    useFocusTrap(
      contentRef,
      dialogTrapOptions(machine, () => api.value.ids.close),
    )

    // A neutral element with the role, not <dialog>: the window carries
    // tabindex (forbidden on <dialog>), and this contract doesn't use
    // showModal() — see SPEC.md.
    return () => {
      const { open, mounted, parts } = api.value
      rendered = open ? 'open' : mounted ? 'closing' : 'closed'
      return h(
        'div',
        { ...mergeProps(attrs, normalize(parts.content)), ref: contentRef },
        slots.default?.(),
      )
    }
  },
  { name: 'DialogContent', inheritAttrs: false, props: ['initialFocus', 'restoreFocus'] },
) as DialogComponent<DialogContentProps>

// =============================================================================
// <Dialog.Title> — the dialog's accessible name
// =============================================================================

export interface DialogTitleProps extends HTMLAttributes {}

export const Title = defineComponent(
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

export const Description = defineComponent(
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

export const Close = defineComponent(
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
