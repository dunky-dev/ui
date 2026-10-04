import { createContext, useContext, type Context } from 'solid-js'
import type { __Name__Api, __Name__Machine } from '@dunky.dev/__name__'

export interface __Name__ContextValue {
  // Fine-grained store proxy: reading a field subscribes to exactly that leaf.
  api: __Name__Api
  machine: __Name__Machine
}

// A `null` default: a default-less context throws on any un-provided read;
// the wrapper restores the loud error for parts.
export const __Name__Context: Context<__Name__ContextValue | null> = createContext<
  __Name__ContextValue | null
>(null)

export const use__Name__Context = (): __Name__ContextValue => {
  const context = useContext(__Name__Context)
  if (context === null) {
    throw new Error('__Name__ parts must be rendered within a <__Name__> root')
  }
  return context
}
