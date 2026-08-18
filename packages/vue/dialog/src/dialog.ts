import {
  Teleport,
  defineComponent,
  h,
  inject,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  toValue,
  watch,
  type ButtonHTMLAttributes,
  type DefineComponent,
  type HTMLAttributes,
  type MaybeRefOrGetter,
  type PropType,
} from 'vue'
import { useFocusTrap } from '@dunky.dev/vue-use-focus-trap'
import { useScrollLock } from '@dunky.dev/vue-use-scroll-lock'
import type { DialogCallbacks, DialogOptions, DialogRole } from '@dunky.dev/dialog'

import { interceptBackNavigation } from '@dunky.dev/dom-navigation'
import {
  getInitialFocus,
  hideExitingLayer,
  isTopmostLayer,
  registerLayer,
  watchExitAnimation,
} from '@dunky.dev/dom-overlay'
import { mergeProps, normalize } from '@dunky.dev/vue-state-machine'
import { DialogContextKey, useDialogContext } from './context'
import { useDialog, type DialogEmit } from './use-dialog'

// Explicit so the exports satisfy --isolatedDeclarations (a bare
// defineComponent call gives the variable no annotatable type).
type PartComponent<Props> = DefineComponent<Props>

// Vue casts an undeclared-default Boolean prop to false — `default: undefined`
// keeps the tri-state (undefined = "not provided") the options contract needs.
const booleanProp = { type: Boolean, default: undefined }

// =============================================================================
// <Dialog> — root, owns the machine and renders no DOM
// =============================================================================

/** The root's props: the core options; the core callbacks are emits (typed
 * here as listener props so templates and TSX check them). */
export interface DialogProps extends Omit<DialogOptions, keyof DialogCallbacks> {
  /** Fired on every open/close transition with the new value (`v-model:open`). */
  'onUpdate:open'?: (open: boolean) => void
  /** Fired before an Escape dismissal; `preventDefault()` vetoes it. */
  onEscapeKeyDown?: DialogCallbacks['onEscapeKeyDown']
  /** Fired before an outside-press dismissal; `preventDefault()` vetoes it. */
  onInteractOutside?: DialogCallbacks['onInteractOutside']
  /** Fired before a back-navigation dismissal; `preventDefault()` vetoes it. */
  onBackNavigation?: DialogCallbacks['onBackNavigation']
}

const DialogRoot = defineComponent({
  name: 'Dialog',
  props: {
    id: { type: String, default: undefined },
    open: booleanProp,
    defaultOpen: booleanProp,
    modal: booleanProp,
    role: { type: String as PropType<DialogRole>, default: undefined },
    closeOnEscape: booleanProp,
    closeOnInteractOutside: booleanProp,
    closeOnBack: booleanProp,
    animated: booleanProp,
  },
  emits: ['update:open', 'escapeKeyDown', 'interactOutside', 'backNavigation'],
  setup(props, { slots, emit }) {
    // Nesting derives from the parent dialog's context (undefined = top-level).
    const depth = (inject(DialogContextKey, undefined)?.depth ?? 0) + 1
    const { api, machine } = useDialog(props, emit as DialogEmit)
    const backdropEl = shallowRef<HTMLDivElement | null>(null)

    provide(DialogContextKey, { api, machine, depth, container: () => null, backdropEl })

    // closeOnBack: while open, a guard entry in the session history turns the
    // host's Back into a dismissal instead of a navigation. Every decision
    // (gate, veto, controlled) lives in the core's backNavigate; this watcher
    // only wires the web mechanics. It lives on the root — the guard concerns
    // the dialog's openness, not any rendered part.
    watch(
      () => api.value.open,
      (open, _previous, onCleanup) => {
        if (!open || !machine.context.closeOnBack) return
        onCleanup(
          interceptBackNavigation(() => {
            api.value.backNavigate()
            return !machine.matches('open')
          }),
        )
      },
      { immediate: true, flush: 'post' },
    )

    return () => slots.default?.()
  },
})

// =============================================================================
// <Dialog.Trigger> — toggles the dialog; focus returns here on close
// =============================================================================

export interface DialogTriggerProps extends ButtonHTMLAttributes {}

export const Trigger: PartComponent<DialogTriggerProps> = defineComponent({
  name: 'DialogTrigger',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const { api } = useDialogContext()
    return () =>
      h(
        'button',
        mergeProps({ type: 'button', ...attrs }, normalize(api.value.parts.trigger)),
        slots.default?.(),
      )
  },
}) as unknown as PartComponent<DialogTriggerProps>

// =============================================================================
// <Dialog.Portal> — teleports the layers out of the tree while open
// =============================================================================

export interface DialogPortalProps {
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export const Portal: PartComponent<DialogPortalProps> = defineComponent({
  name: 'DialogPortal',
  props: {
    container: { type: Object as PropType<HTMLElement | null>, default: null },
  },
  setup(props, { slots }) {
    const context = useDialogContext()
    // Re-provide the context with the scoped container (null = page body) so
    // Content locks the right scroll surface.
    provide(DialogContextKey, { ...context, container: () => props.container ?? null })
    return () => {
      // `mounted`, not `open`: an animated dialog stays in the tree through
      // `closing` so its exit visual can play before everything unmounts.
      if (!context.api.value.mounted || typeof document === 'undefined') return null
      // A concrete array: h's Teleport overload doesn't accept undefined children.
      return h(Teleport, { to: props.container ?? document.body }, slots.default?.() ?? [])
    }
  },
}) as unknown as PartComponent<DialogPortalProps>

// =============================================================================
// <Dialog.Backdrop> — the layer behind the dialog window
// =============================================================================

export interface DialogBackdropProps extends HTMLAttributes {}

export const Backdrop: PartComponent<DialogBackdropProps> = defineComponent({
  name: 'DialogBackdrop',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const { api, machine, backdropEl } = useDialogContext()
    return () => {
      // Only a modal dialog dims the page — non-modal coexists with it.
      if (!machine.context.modal) return null

      const { onClick, ...bindings } = normalize(api.value.parts.backdrop) as {
        onClick?: (event: MouseEvent) => void
      } & Record<string, unknown>

      const merged = mergeProps(
        { ...attrs },
        {
          ...bindings,
          // Only the topmost dialog of a stack answers an outside press.
          onClick: (event: MouseEvent) => {
            if (isTopmostLayer(machine.context.id)) onClick?.(event)
          },
        },
      )

      return h('div', { ...merged, ref: backdropEl }, slots.default?.())
    }
  },
}) as unknown as PartComponent<DialogBackdropProps>

// =============================================================================
// <Dialog.Viewport> — the positioning + scroll layer around the dialog window
// =============================================================================

export interface DialogViewportProps extends HTMLAttributes {}

export const Viewport: PartComponent<DialogViewportProps> = defineComponent({
  name: 'DialogViewport',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const { api, machine } = useDialogContext()
    return () => {
      const { onClick, ...bindings } = normalize(api.value.parts.viewport) as {
        onClick?: (event: MouseEvent) => void
      } & Record<string, unknown>

      const merged = mergeProps(
        { ...attrs },
        {
          ...bindings,
          // Content presses bubble up here — only a press that started on the
          // viewport itself is an outside interaction, and only the topmost
          // dialog of a stack answers it.
          onClick: (event: MouseEvent) => {
            if (event.target !== event.currentTarget) return
            if (!isTopmostLayer(machine.context.id)) return
            onClick?.(event)
          },
        },
      )

      return h('div', merged, slots.default?.())
    }
  },
}) as unknown as PartComponent<DialogViewportProps>

// =============================================================================
// <Dialog.Content> — the dialog window: focus moves in on open, restores on
// close, traps while modal
// =============================================================================

export interface DialogContentProps extends HTMLAttributes {
  /** The element to focus when the dialog opens; a ref or getter is resolved
   * at open time, so a template ref that fills after setup works.
   * @default the dialog window */
  initialFocus?: MaybeRefOrGetter<HTMLElement | null>
}

export const Content: PartComponent<DialogContentProps> = defineComponent({
  name: 'DialogContent',
  inheritAttrs: false,
  props: {
    initialFocus: {
      type: [Object, Function] as PropType<MaybeRefOrGetter<HTMLElement | null>>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const { api, machine, depth, container, backdropEl } = useDialogContext()
    const contentEl = shallowRef<HTMLDialogElement | null>(null)

    // The machine's `open` state is the edge, not mount/unmount — an animated
    // dialog stays mounted through `closing`, and the stack, containment, and
    // focus must release the moment the exit starts, not when it finishes.
    // One watcher keeps the ordering right both ways: the stack joins before
    // focus moves in, and on close it must release the layers beneath
    // (un-inert them) before focus can move back out to one of them. The
    // element is part of the source: a template ref only fills after setup.
    watch(
      () => [api.value.open, contentEl.value] as const,
      ([open, content], _previous, onCleanup) => {
        if (!open || content === null) return

        const previous = document.activeElement
        const unregister = registerLayer({
          id: machine.context.id,
          depth,
          element: content,
          modal: machine.context.modal,
          backdrop: () => backdropEl.value,
        })

        // preventScroll everywhere: the scroll lock already froze the surface, so
        // moving focus must not scroll it — otherwise opening jumps the (top-of-
        // container) dialog into view and closing jumps back to the trigger.
        const target = toValue(props.initialFocus) ?? getInitialFocus(content)
        target.focus({ preventScroll: true })
        // A target that can't take focus (disabled, hidden) falls back to the panel.
        if (document.activeElement !== target) content.focus({ preventScroll: true })

        onCleanup(() => {
          unregister()
          if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
        })
      },
      { immediate: true, flush: 'post' },
    )

    // The exit window: Content rendered while not open only happens in
    // `closing`. The layer has already released everything above, so hide the
    // still-painting layer from interaction and report when its visual is done;
    // the watcher's cleanup is the reopen interrupt (and final unmount) undoing
    // both.
    watch(
      () => [api.value.open, contentEl.value] as const,
      ([open, content], _previous, onCleanup) => {
        if (open || content === null) return

        const undoHide = hideExitingLayer(content, container() ?? document.body, backdropEl.value)
        const cancelWatch = watchExitAnimation(content, () =>
          machine.send({ type: 'exit.complete' }),
        )
        onCleanup(() => {
          cancelWatch()
          undoHide()
        })
      },
      { immediate: true, flush: 'post' },
    )

    // The lock spans the whole mount — through `closing` too: releasing it
    // mid-exit would bring the scrollbar back and reflow the page under the
    // still-painting layer. A scoped dialog locks its portal container; a page
    // dialog locks the body.
    useScrollLock(machine.context.modal, () => container())

    useFocusTrap(contentEl, {
      // Only a modal dialog traps, and only while topmost — a nested dialog
      // owns focus while open.
      enabled: () => machine.context.modal && isTopmostLayer(machine.context.id),
      // The Close part is the cycle's last stop wherever it renders (core
      // SPEC); found by its derived id.
      last: () => document.getElementById(api.value.ids.close),
    })

    return () =>
      h(
        'dialog',
        {
          ...mergeProps(
            { ...attrs },
            {
              ...normalize(api.value.parts.content),
              // The native <dialog> is display:none without `open`; Content only
              // mounts while the dialog occupies the tree (open or mid-exit), so
              // the attribute is unconditionally true.
              open: true,
            },
          ),
          ref: contentEl,
        },
        slots.default?.(),
      )
  },
}) as unknown as PartComponent<DialogContentProps>

// =============================================================================
// <Dialog.Title> — the dialog's accessible name
// =============================================================================

export interface DialogTitleProps extends HTMLAttributes {}

export const Title: PartComponent<DialogTitleProps> = defineComponent({
  name: 'DialogTitle',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const { api, machine } = useDialogContext()

    onMounted(() => machine.send({ type: 'part.presence', part: 'title', present: true }))
    onUnmounted(() => machine.send({ type: 'part.presence', part: 'title', present: false }))

    return () =>
      h('h2', mergeProps({ ...attrs }, normalize(api.value.parts.title)), slots.default?.())
  },
}) as unknown as PartComponent<DialogTitleProps>

// =============================================================================
// <Dialog.Description> — the dialog's accessible description
// =============================================================================

export interface DialogDescriptionProps extends HTMLAttributes {}

export const Description: PartComponent<DialogDescriptionProps> = defineComponent({
  name: 'DialogDescription',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const { api, machine } = useDialogContext()

    onMounted(() => machine.send({ type: 'part.presence', part: 'description', present: true }))
    onUnmounted(() => machine.send({ type: 'part.presence', part: 'description', present: false }))

    return () =>
      h('div', mergeProps({ ...attrs }, normalize(api.value.parts.description)), slots.default?.())
  },
}) as unknown as PartComponent<DialogDescriptionProps>

// =============================================================================
// <Dialog.Close> — the visible in-dialog close affordance
// =============================================================================

export interface DialogCloseProps extends ButtonHTMLAttributes {}

export const Close: PartComponent<DialogCloseProps> = defineComponent({
  name: 'DialogClose',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const { api } = useDialogContext()
    return () =>
      h(
        'button',
        mergeProps({ type: 'button', ...attrs }, normalize(api.value.parts.close)),
        slots.default?.(),
      )
  },
}) as unknown as PartComponent<DialogCloseProps>

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

export const Dialog: DefineComponent<DialogProps> & Parts = Object.assign(
  DialogRoot as unknown as DefineComponent<DialogProps>,
  { Trigger, Portal, Backdrop, Viewport, Content, Title, Description, Close },
)
