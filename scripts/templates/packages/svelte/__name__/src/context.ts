import { createContext } from 'svelte'
import type { __Name__Api, __Name__Machine } from '@dunky.dev/__name__'

export interface __Name__ContextValue {
  // A getter: the connected api is a fresh snapshot per machine change, so a
  // destructured read would freeze the first one.
  readonly api: __Name__Api
  machine: __Name__Machine
}

const [get__Name__Context, set__Name__Context, has__Name__Context] =
  createContext<__Name__ContextValue>()

export { set__Name__Context }

export const use__Name__Context = (): __Name__ContextValue => {
  if (!has__Name__Context()) {
    throw new Error('__Name__ parts must be rendered within a <__Name__> root')
  }
  return get__Name__Context()
}
