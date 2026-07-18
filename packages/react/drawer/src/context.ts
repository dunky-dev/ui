import { createContext, useContext, type Context } from 'react'
import type { DrawerApi, DrawerMachine } from '@dunky.dev/drawer'

export interface DrawerContextValue {
  api: DrawerApi
  machine: DrawerMachine
}

export const DrawerContext: Context<DrawerContextValue | undefined> = createContext<
  DrawerContextValue | undefined
>(undefined)

export const useDrawerContext = (): DrawerContextValue => {
  const context = useContext(DrawerContext)
  if (context === undefined) {
    throw new Error('Drawer parts must be rendered within a <Drawer> root')
  }
  return context
}

// The element the Portal teleported into, or null for the page body. Content
// reads it to scope the scroll lock to that container instead of the page.
export const DrawerPortalContext: Context<HTMLElement | null> = createContext<HTMLElement | null>(
  null,
)
