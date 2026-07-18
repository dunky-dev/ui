import { createContext, useContext, type Context, type RefObject } from 'react'
import type { ToastApi, ToastMachine } from '@dunky.dev/toast'

import type { ToastRegistry } from './registry'

export interface ToastContextValue {
  api: ToastApi
  machine: ToastMachine
}

export const ToastContext: Context<ToastContextValue | undefined> = createContext<
  ToastContextValue | undefined
>(undefined)

export const useToastContext = (): ToastContextValue => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('Toast parts must be rendered within a <Toast> root')
  }
  return context
}

// The provider's shared surface: the default duration and region label, plus
// the registry the viewport broadcasts pause/resume through and the viewport
// element itself — where focus parks when the toast holding it dismisses.
export interface ToastProviderContextValue {
  duration: number
  label: string
  registry: ToastRegistry
  viewportRef: RefObject<HTMLOListElement | null>
}

export const ToastProviderContext: Context<ToastProviderContextValue | undefined> = createContext<
  ToastProviderContextValue | undefined
>(undefined)

export const useToastProviderContext = (): ToastProviderContextValue => {
  const context = useContext(ToastProviderContext)
  if (context === undefined) {
    throw new Error('Toast and Toast.Viewport must be rendered within a <Toast.Provider>')
  }
  return context
}
