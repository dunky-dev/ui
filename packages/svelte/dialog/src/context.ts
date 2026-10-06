import { getContext, hasContext, setContext } from 'svelte'
import type { DialogApi, DialogMachine } from '@dunky.dev/dialog'

export interface DialogContextValue {
  // A getter: the connected api is a fresh snapshot per machine change, so a
  // destructured read would freeze the first one.
  readonly api: DialogApi
  machine: DialogMachine
  // Nesting level (1 = top-level); decides the topmost dialog of a stack.
  depth: number
  // The Portal's container (null = page body). The root provides null; the
  // Portal re-provides the context with a getter over its prop.
  readonly container: HTMLElement | null
  // The rendered Backdrop, shared so Content's stack entry can except it from
  // the containment. A plain box: the stack reads it on demand, nothing
  // re-renders on it.
  backdropRef: { current: HTMLDivElement | null }
}

// A private key rather than `createContext()`: its `has` arrived only in
// Svelte 5.57, and the root needs a non-throwing lookup for its parent.
const DIALOG_CONTEXT = Symbol('dialog')

export const setDialogContext = (context: DialogContextValue): DialogContextValue =>
  setContext(DIALOG_CONTEXT, context)

export const useDialogContext = (): DialogContextValue => {
  if (!hasContext(DIALOG_CONTEXT)) {
    throw new Error('Dialog parts must be rendered within a <Dialog> root')
  }
  return getContext<DialogContextValue>(DIALOG_CONTEXT)
}

// The root's own lookup: an enclosing dialog makes this one nested.
export const getParentDialogContext = (): DialogContextValue | null =>
  hasContext(DIALOG_CONTEXT) ? getContext<DialogContextValue>(DIALOG_CONTEXT) : null
