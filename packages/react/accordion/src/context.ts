import { createContext, useContext, type Context } from 'react'
import type { AccordionApi, AccordionMachine } from '@dunky.dev/accordion'

export interface AccordionContextValue {
  api: AccordionApi
  machine: AccordionMachine
}

export const AccordionContext: Context<AccordionContextValue | undefined> = createContext<
  AccordionContextValue | undefined
>(undefined)

export const useAccordionContext = (): AccordionContextValue => {
  const context = useContext(AccordionContext)
  if (context === undefined) {
    throw new Error('Accordion parts must be rendered within an <Accordion> root')
  }
  return context
}

// The item's identity for the parts inside it — Header, Trigger, and Content
// read their item's value and disabled flag from here.
export interface AccordionItemContextValue {
  value: string
  disabled: boolean
}

export const AccordionItemContext: Context<AccordionItemContextValue | undefined> = createContext<
  AccordionItemContextValue | undefined
>(undefined)

export const useAccordionItemContext = (): AccordionItemContextValue => {
  const context = useContext(AccordionItemContext)
  if (context === undefined) {
    throw new Error('Accordion item parts must be rendered within an <Accordion.Item>')
  }
  return context
}
