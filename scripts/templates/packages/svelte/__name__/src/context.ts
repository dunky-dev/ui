import { getContext, hasContext, setContext } from 'svelte'
import type { __Name__Api, __Name__Machine } from '@dunky.dev/__name__'

export interface __Name__ContextValue {
  // A getter: the connected api is a fresh snapshot per machine change, so a
  // destructured read would freeze the first one.
  readonly api: __Name__Api
  machine: __Name__Machine
}

// A private key rather than `createContext()`: its `has` only arrived in
// Svelte 5.57, far above the substrate's floor (5.20).
const __camelName__Context = Symbol('__name__')

export const set__Name__Context = (context: __Name__ContextValue): __Name__ContextValue =>
  setContext(__camelName__Context, context)

export const use__Name__Context = (): __Name__ContextValue => {
  if (!hasContext(__camelName__Context)) {
    throw new Error('__Name__ parts must be rendered within a <__Name__> root')
  }
  return getContext<__Name__ContextValue>(__camelName__Context)
}
