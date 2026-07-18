import { createContext, useContext, type Context } from 'react'
import type { TooltipApi, TooltipMachine } from '@dunky.dev/tooltip'

export interface TooltipContextValue {
  api: TooltipApi
  machine: TooltipMachine
}

export const TooltipContext: Context<TooltipContextValue | undefined> = createContext<
  TooltipContextValue | undefined
>(undefined)

export const useTooltipContext = (): TooltipContextValue => {
  const context = useContext(TooltipContext)
  if (context === undefined) {
    throw new Error('Tooltip parts must be rendered within a <Tooltip> root')
  }
  return context
}
