import { createContext, useContext, type Context } from 'react'
import type { SelectApi, SelectMachine } from '@dunky.dev/select'

export interface SelectContextValue {
  api: SelectApi
  machine: SelectMachine
}

export const SelectContext: Context<SelectContextValue | undefined> = createContext<
  SelectContextValue | undefined
>(undefined)

export const useSelectContext = (): SelectContextValue => {
  const context = useContext(SelectContext)
  if (context === undefined) {
    throw new Error('Select parts must be rendered within a <Select> root')
  }
  return context
}

// The owning item's value, so ItemIndicator knows which option it decorates
// without a prop. Kept internal — parts reason through the root context.
export const SelectItemContext: Context<string | undefined> = createContext<string | undefined>(
  undefined,
)

export const useSelectItemContext = (): string => {
  const value = useContext(SelectItemContext)
  if (value === undefined) {
    throw new Error('Select item parts must be rendered within a <Select.Item>')
  }
  return value
}
