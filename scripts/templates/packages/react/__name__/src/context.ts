import { createContext, useContext, type Context } from 'react'
import type { __Name__Api, __Name__Machine } from '@dunky.dev/__name__'

export interface __Name__ContextValue {
  api: __Name__Api
  machine: __Name__Machine
}

export const __Name__Context: Context<__Name__ContextValue | undefined> = createContext<
  __Name__ContextValue | undefined
>(undefined)

export const use__Name__Context = (): __Name__ContextValue => {
  const context = useContext(__Name__Context)
  if (context === undefined) {
    throw new Error('__Name__ parts must be rendered within a <__Name__> root')
  }
  return context
}
