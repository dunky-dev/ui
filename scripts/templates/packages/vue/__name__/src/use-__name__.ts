import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMachine } from '@dunky.dev/vue-state-machine'
import { __camelName__Machine, __camelName__Connect } from '@dunky.dev/__name__'
import type { __Name__Options } from '@dunky.dev/__name__'

import type { __Name__ContextValue } from './context'
import { __camelName__Effects } from './effects'

/**
 * Owns one __name__ machine for the <__Name__> root: created once, options
 * re-synced through the reactive getter, effects run after mount, api a ref.
 */
export function use__Name__(options: MaybeRefOrGetter<__Name__Options>): __Name__ContextValue {
  // A computed: the adapter reads the options from every effect's dependency
  // getter, and the object is built once per change rather than per read.
  return useMachine(
    __camelName__Machine,
    __camelName__Connect,
    __camelName__Effects,
    computed(() => toValue(options)),
  )
}
