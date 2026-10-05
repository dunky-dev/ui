import { createContext } from 'svelte'
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

const [getDialogContext, setDialogContext, hasDialogContext] = createContext<DialogContextValue>()

export { setDialogContext }

export const useDialogContext = (): DialogContextValue => {
  if (!hasDialogContext()) {
    throw new Error('Dialog parts must be rendered within a <Dialog> root')
  }
  return getDialogContext()
}

// The root's own lookup: an enclosing dialog makes this one nested.
export const getParentDialogContext = (): DialogContextValue | null =>
  hasDialogContext() ? getDialogContext() : null
