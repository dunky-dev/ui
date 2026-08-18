import { createContext, useContext, type Accessor, type Context } from 'solid-js'
import type { DialogApi, DialogMachine } from '@dunky.dev/dialog'

export interface DialogContextValue {
  // The connected api as a fine-grained store proxy — reading a field in JSX
  // or an effect subscribes to exactly that leaf.
  api: DialogApi
  machine: DialogMachine
  // Nesting level (1 = top-level). Decides the topmost dialog of a stack for
  // Escape, focus, and assistive-tech containment.
  depth: number
  // The element the Portal teleported into, or null for the page body —
  // Content scopes the scroll lock to it. An accessor so the Portal's prop
  // stays live: the root provides null; Portal re-provides the context with
  // the field filled in.
  container: Accessor<HTMLElement | null>
  // The rendered Backdrop element, shared because Backdrop and Content are
  // sibling parts: Content's stack entry excepts its own backdrop from the
  // containment so it stays pressable while its dialog is topmost. A plain
  // mutable box, not a signal: the layer walk reads it synchronously inside
  // the same settle that mounts the backdrop, before a signal write would
  // commit.
  backdropRef: { current: HTMLDivElement | null }
}

// The `null` default keeps the root's parent-lookup non-throwing (depth
// derives from an optional read; a default-less context throws on it); the
// wrapper below restores the loud error for parts, naming the component.
export const DialogContext: Context<DialogContextValue | null> =
  createContext<DialogContextValue | null>(null)

export const useDialogContext = (): DialogContextValue => {
  const context = useContext(DialogContext)
  if (context === null) {
    throw new Error('Dialog parts must be rendered within a <Dialog> root')
  }
  return context
}
