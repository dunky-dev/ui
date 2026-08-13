import {
  forwardRef,
  useEffect,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import {
  Modal,
  Pressable,
  Text,
  View,
  type ModalProps,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native'
import type { DialogOptions } from '@dunky.dev/dialog'
import { mergeProps, normalize } from '@dunky.dev/native-state-machine'
import { DialogContext, useDialogContext } from './context'
import { useDialog } from './use-dialog'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Dialog> — root, owns the machine and renders no view
// =============================================================================

export interface DialogProps extends DialogOptions {
  children?: ReactNode
}

export const Dialog: ((props: DialogProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const { api, machine } = useDialog(options)
  return <DialogContext.Provider value={{ api, machine }}>{children}</DialogContext.Provider>
}

// =============================================================================
// <Dialog.Trigger> — toggles the dialog
// =============================================================================

export interface DialogTriggerProps extends PressableProps {}

export const Trigger: PartComponent<DialogTriggerProps, View> = forwardRef<
  View,
  DialogTriggerProps
>((props, forwardedRef) => {
  const { api } = useDialogContext()
  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.parts.trigger),
  ) as PressableProps
  return <Pressable {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Portal> — the host's layer above the app: a React Native Modal
// =============================================================================

export interface DialogPortalProps {
  children?: ReactNode
  /** The Modal's own entry animation. @default 'none' */
  animationType?: ModalProps['animationType']
}

export const Portal = ({ children, animationType = 'none' }: DialogPortalProps): ReactNode => {
  const { api, machine } = useDialogContext()

  // The exit window: native has no transitionend, so the exit visual is
  // reported finished the moment `closing` renders — the core contract holds
  // (the state exists, the change is already reported) without a host signal
  // to wait for. Entry/exit visuals belong to the Modal's animationType.
  useEffect(() => {
    if (!api.open && api.mounted) machine.send({ type: 'exit.complete' })
  }, [api.open, api.mounted, machine])

  // `mounted`, not `open`: symmetry with the web Portal — nothing stays
  // mounted while closed.
  if (!api.mounted) return null

  return (
    <Modal
      transparent
      visible
      animationType={animationType}
      // The hardware back (Android's button/gesture; Escape under
      // react-native-web) is the host's back navigation — the whole decision
      // (callback, veto, closeOnBack gate, controlled) lives in the core.
      onRequestClose={() => api.backNavigate()}
    >
      {children}
    </Modal>
  )
}

// =============================================================================
// <Dialog.Backdrop> — the layer behind the window; pressing it is the outside
// interaction
// =============================================================================

export interface DialogBackdropProps extends PressableProps {}

export const Backdrop: PartComponent<DialogBackdropProps, View> = forwardRef<
  View,
  DialogBackdropProps
>((props, forwardedRef) => {
  const { api, machine } = useDialogContext()

  // Only a modal dialog dims the app behind — non-modal coexists with it.
  if (!machine.context.modal) return null

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.parts.backdrop),
  ) as PressableProps
  return <Pressable {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Viewport> — the positioning layer around the window
// =============================================================================

export interface DialogViewportProps extends ViewProps {}

export const Viewport: PartComponent<DialogViewportProps, View> = forwardRef<
  View,
  DialogViewportProps
>((props, forwardedRef) => {
  const { api } = useDialogContext()
  const merged = mergeProps(
    // `box-none`: the viewport itself never takes a press, so a press on the
    // empty area around the window falls through to the Backdrop behind it —
    // that fall-through is this substrate's viewport-press-counts-as-outside.
    { pointerEvents: 'box-none' as const, ...(props as Record<string, unknown>) },
    normalize(api.parts.viewport),
  ) as ViewProps
  return <View {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Content> — the dialog window
// =============================================================================

export interface DialogContentProps extends ViewProps {}

export const Content: PartComponent<DialogContentProps, View> = forwardRef<
  View,
  DialogContentProps
>((props, forwardedRef) => {
  const { api, machine } = useDialogContext()
  const merged = mergeProps(props as Record<string, unknown>, {
    ...normalize(api.parts.content),
    // The host's modal containment for assistive tech (iOS): everything
    // outside this view stops existing for VoiceOver — the native
    // aria-modal. The normalize translation has no home for it because only
    // views, not attributes, carry it.
    accessibilityViewIsModal: machine.context.modal,
  }) as ViewProps
  return <View {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Title> — the dialog's accessible name
// =============================================================================

export interface DialogTitleProps extends TextProps {}

export const Title: PartComponent<DialogTitleProps, Text> = forwardRef<Text, DialogTitleProps>(
  (props, forwardedRef) => {
    const { api, machine } = useDialogContext()

    useEffect(() => {
      machine.send({ type: 'part.presence', part: 'title', present: true })
      return () => machine.send({ type: 'part.presence', part: 'title', present: false })
    }, [machine])

    const merged = mergeProps(
      props as Record<string, unknown>,
      normalize(api.parts.title),
    ) as TextProps
    return <Text {...merged} ref={forwardedRef} />
  },
)

// =============================================================================
// <Dialog.Description> — the dialog's accessible description
// =============================================================================

export interface DialogDescriptionProps extends TextProps {}

export const Description: PartComponent<DialogDescriptionProps, Text> = forwardRef<
  Text,
  DialogDescriptionProps
>((props, forwardedRef) => {
  const { api, machine } = useDialogContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'description', present: true })
    return () => machine.send({ type: 'part.presence', part: 'description', present: false })
  }, [machine])

  const merged = mergeProps(
    props as Record<string, unknown>,
    normalize(api.parts.description),
  ) as TextProps
  return <Text {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Dialog.Close> — the visible in-dialog close affordance
// =============================================================================

export interface DialogCloseProps extends PressableProps {}

export const Close: PartComponent<DialogCloseProps, View> = forwardRef<View, DialogCloseProps>(
  (props, forwardedRef) => {
    const { api } = useDialogContext()
    const merged = mergeProps(
      props as Record<string, unknown>,
      normalize(api.parts.close),
    ) as PressableProps
    return <Pressable {...merged} ref={forwardedRef} />
  },
)

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
