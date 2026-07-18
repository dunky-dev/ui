import { useMachine } from '@dunky.dev/react-state-machine'
import { __camelName__Machine, __camelName__Connect } from '@dunky.dev/__name__'
import type { __Name__Options } from '@dunky.dev/__name__'

import type { __Name__ContextValue } from './context'
import { __camelName__Effects } from './effects'

/**
 * Owns one __name__ machine for the <__Name__> root. `useMachine` creates it
 * once (StrictMode-safe), re-syncs options each render, runs the substrate
 * effects, and exposes the connected api.
 */
export function use__Name__(options: __Name__Options): __Name__ContextValue {
  return useMachine(__camelName__Machine, __camelName__Connect, __camelName__Effects, options)
}
