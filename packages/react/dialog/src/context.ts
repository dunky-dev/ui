import { createContext, useContext, type Context, type RefObject } from 'react'
import type { DialogApi, DialogMachine } from '@dunky.dev/dialog'

export interface DialogContextValue {
  api: DialogApi
  machine: DialogMachine
  // Nesting level (1 = top-level). Decides the topmost dialog of a stack for
  // Escape, focus, and assistive-tech containment.
  depth: number
  // The element the Portal teleported into, or null for the page body —
  // Content scopes the scroll lock to it. The root provides null; Portal
  // re-provides the context with the field filled in.
  container: HTMLElement | null
  // The rendered Backdrop element, shared because Backdrop and Content are
  // sibling parts: Content's stack entry excepts its own backdrop from the
  // containment so it stays pressable while its dialog is topmost.
  backdropRef: RefObject<HTMLDivElement | null>
}

export const DialogContext: Context<DialogContextValue | undefined> = createContext<
  DialogContextValue | undefined
>(undefined)

export const useDialogContext = (): DialogContextValue => {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('Dialog parts must be rendered within a <Dialog> root')
  }
  return context
}
