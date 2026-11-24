import { inject, type ComputedRef, type InjectionKey, type ShallowRef } from 'vue'
import type { DialogApi, DialogMachine } from '@dunky.dev/dialog'

export interface DialogContextValue {
  // The connected api: its value is replaced on every machine change, so a
  // part whose render reads it re-renders exactly then.
  api: ComputedRef<DialogApi>
  machine: DialogMachine
  // Nesting level (1 = top-level). Decides the topmost dialog of a stack for
  // Escape, focus, and assistive-tech containment.
  depth: number
  // The element the Portal teleports into, or null for the page body —
  // Content scopes the scroll lock to it. A getter so the Portal's prop stays
  // live: the root provides null, Portal re-provides the context filled in.
  container: () => HTMLElement | null
  // Whether the parts render inside a Portal — without one the window sits in
  // the page itself, which bounds what its exit window may hide.
  portalled: boolean
  // The rendered Backdrop, shared because Backdrop and Content are sibling
  // parts: Content's stack entry excepts its own backdrop from the
  // containment so it stays pressable while its dialog is topmost.
  backdropRef: ShallowRef<HTMLElement | null>
  // The rendered Viewport: without a Portal the layer sits in the page, and
  // Content's exit window hides the layer from its Viewport down.
  viewportRef: ShallowRef<HTMLElement | null>
}

export const DialogContextKey: InjectionKey<DialogContextValue> = Symbol('DialogContext')

export const useDialogContext = (): DialogContextValue => {
  const context = inject(DialogContextKey, null)
  if (context === null) {
    throw new Error('Dialog parts must be rendered within a <Dialog> root')
  }
  return context
}
