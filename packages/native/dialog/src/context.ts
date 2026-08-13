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
