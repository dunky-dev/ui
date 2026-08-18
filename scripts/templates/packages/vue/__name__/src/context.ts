import { inject, type ComputedRef, type InjectionKey } from 'vue'
import type { __Name__Api, __Name__Machine } from '@dunky.dev/__name__'

export interface __Name__ContextValue {
  api: ComputedRef<__Name__Api>
  machine: __Name__Machine
}

export const __Name__ContextKey: InjectionKey<__Name__ContextValue> = Symbol('__Name__Context')

export const use__Name__Context = (): __Name__ContextValue => {
  const context = inject(__Name__ContextKey, undefined)
  if (context === undefined) {
    throw new Error('__Name__ parts must be rendered within a <__Name__> root')
  }
  return context
}
