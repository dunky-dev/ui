import { createContext, useContext, type Context } from 'react'
import type { TabsApi, TabsMachine } from '@dunky.dev/tabs'

export interface TabsContextValue {
  api: TabsApi
  machine: TabsMachine
}

export const TabsContext: Context<TabsContextValue | undefined> = createContext<
  TabsContextValue | undefined
>(undefined)

export const useTabsContext = (): TabsContextValue => {
  const context = useContext(TabsContext)
  if (context === undefined) {
    throw new Error('Tabs parts must be rendered within a <Tabs> root')
  }
  return context
}
