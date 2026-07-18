import { createContext, useContext, type Context } from 'react'
import type { RadioApi, RadioMachine } from '@dunky.dev/radio'

export interface RadioContextValue {
  api: RadioApi
  machine: RadioMachine
}

export const RadioContext: Context<RadioContextValue | undefined> = createContext<
  RadioContextValue | undefined
>(undefined)

export const useRadioContext = (): RadioContextValue => {
  const context = useContext(RadioContext)
  if (context === undefined) {
    throw new Error('Radio parts must be rendered within a <Radio> root')
  }
  return context
}

// Item scope: which item an indicator decorates, so it needs no `value` prop
// of its own. Provided by <Radio.Item>, derived from the api each render.
export interface RadioItemContextValue {
  value: string
  disabled: boolean
  checked: boolean
}

export const RadioItemContext: Context<RadioItemContextValue | undefined> = createContext<
  RadioItemContextValue | undefined
>(undefined)

export const useRadioItemContext = (): RadioItemContextValue => {
  const context = useContext(RadioItemContext)
  if (context === undefined) {
    throw new Error('Radio.ItemIndicator must be rendered within a <Radio.Item>')
  }
  return context
}
