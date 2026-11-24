import { useMachine } from '@dunky.dev/svelte-state-machine'
import { __camelName__Machine, __camelName__Connect } from '@dunky.dev/__name__'
import type { __Name__Options } from '@dunky.dev/__name__'

import type { __Name__ContextValue } from './context.js'
import { __camelName__Effects } from './effects.js'

/**
 * Owns one __name__ machine for the <__Name__> root: created once from the
 * first read of the props getter, which keeps later props flowing in; `api`
 * is a fresh snapshot per machine change.
 */
export function use__Name__(options: () => __Name__Options): __Name__ContextValue {
  return useMachine(__camelName__Machine, __camelName__Connect, __camelName__Effects, options)
}
