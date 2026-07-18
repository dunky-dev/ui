import { createContext, useContext, type Context } from 'react'
import type { SwitchApi, SwitchMachine } from '@dunky.dev/switch'

export interface SwitchContextValue {
  api: SwitchApi
  machine: SwitchMachine
}

export const SwitchContext: Context<SwitchContextValue | undefined> = createContext<
  SwitchContextValue | undefined
>(undefined)

export const useSwitchContext = (): SwitchContextValue => {
  const context = useContext(SwitchContext)
  if (context === undefined) {
    throw new Error('Switch parts must be rendered within a <Switch> root')
  }
  return context
}
