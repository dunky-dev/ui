import { createContext, useContext, type Context } from 'react'
import type { CheckboxApi, CheckboxMachine } from '@dunky.dev/checkbox'

export interface CheckboxContextValue {
  api: CheckboxApi
  machine: CheckboxMachine
}

export const CheckboxContext: Context<CheckboxContextValue | undefined> = createContext<
  CheckboxContextValue | undefined
>(undefined)

export const useCheckboxContext = (): CheckboxContextValue => {
  const context = useContext(CheckboxContext)
  if (context === undefined) {
    throw new Error('Checkbox parts must be rendered within a <Checkbox> root')
  }
  return context
}
