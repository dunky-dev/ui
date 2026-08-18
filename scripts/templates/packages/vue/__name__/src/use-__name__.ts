import { useMachine } from '@dunky.dev/vue-state-machine'
import { __camelName__Machine, __camelName__Connect } from '@dunky.dev/__name__'
import type { __Name__Callbacks, __Name__Options } from '@dunky.dev/__name__'

import type { __Name__ContextValue } from './context'
import { __camelName__Effects } from './effects'

export type __Name__Emit = (event: 'disable') => void

/**
 * Owns one __name__ machine for the <__Name__> root. `useMachine` creates it
 * once, re-syncs options through the reactive getter, runs the substrate
 * effects, and exposes the connected api as a ref. The core callbacks forward
 * to emits — listeners run synchronously, and attach/detach stays live.
 */
export function use__Name__(props: __Name__Options, emit: __Name__Emit): __Name__ContextValue {
  const callbacks: __Name__Callbacks = {
    disable: () => emit('disable'),
  }
  return useMachine(__camelName__Machine, __camelName__Connect, __camelName__Effects, () => ({
    ...props,
    ...callbacks,
  }))
}
