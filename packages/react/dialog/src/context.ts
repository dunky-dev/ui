import { createContext, useContext, type Context } from 'react'
import type { DialogApi, DialogMachine } from '@dunky.dev/dialog'

export interface DialogContextValue {
  api: DialogApi
  machine: DialogMachine
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

// Nesting level (0 = outside any dialog, 1 = top-level). Kept internal and out
// of the public context — parts only reason about open/close. It decides the
// topmost dialog for Escape, focus, and assistive-tech containment when nested.
export const DialogDepthContext: Context<number> = createContext(0)
