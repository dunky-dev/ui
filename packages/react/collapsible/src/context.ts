import { createContext, useContext, type Context } from 'react'
import type { CollapsibleApi, CollapsibleMachine } from '@dunky.dev/collapsible'

export interface CollapsibleContextValue {
  api: CollapsibleApi
  machine: CollapsibleMachine
}

export const CollapsibleContext: Context<CollapsibleContextValue | undefined> = createContext<
  CollapsibleContextValue | undefined
>(undefined)

export const useCollapsibleContext = (): CollapsibleContextValue => {
  const context = useContext(CollapsibleContext)
  if (context === undefined) {
    throw new Error('Collapsible parts must be rendered within a <Collapsible> root')
  }
  return context
}
