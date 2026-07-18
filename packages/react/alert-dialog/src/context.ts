import { createContext, useContext, type Context } from 'react'
import type { AlertDialogApi, AlertDialogMachine } from '@dunky.dev/alert-dialog'

export interface AlertDialogContextValue {
  api: AlertDialogApi
  machine: AlertDialogMachine
}

export const AlertDialogContext: Context<AlertDialogContextValue | undefined> = createContext<
  AlertDialogContextValue | undefined
>(undefined)

export const useAlertDialogContext = (): AlertDialogContextValue => {
  const context = useContext(AlertDialogContext)
  if (context === undefined) {
    throw new Error('AlertDialog parts must be rendered within an <AlertDialog> root')
  }
  return context
}

// The element the Portal teleported into, or null for the page body. Content
// reads it to scope the scroll lock to that container instead of the page.
export const AlertDialogPortalContext: Context<HTMLElement | null> =
  createContext<HTMLElement | null>(null)
