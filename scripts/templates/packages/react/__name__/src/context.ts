import { createContext, useContext, type Context } from 'react'
import type { Machine } from '@dunky.dev/state-machine'
import type {
  __Name__Api,
  __Name__Context as __Name__MachineContext,
  __Name__MachineEvent,
  __Name__StateName,
} from '@dunky.dev/__name__'

export type __Name__Service = Machine<__Name__StateName, __Name__MachineContext, __Name__MachineEvent>

export interface __Name__ContextValue {
  api: __Name__Api
  service: __Name__Service
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
