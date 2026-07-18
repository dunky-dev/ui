import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { collapsibleMachine, collapsibleConnect } from '@dunky.dev/collapsible'
import type { CollapsibleOptions } from '@dunky.dev/collapsible'

import type { CollapsibleContextValue } from './context'
import { collapsibleEffects } from './effects'

/**
 * Owns one collapsible machine for the <Collapsible> root. `useMachine` creates
 * it once (StrictMode-safe), re-syncs options each render, runs the substrate
 * effects, and exposes the connected api.
 */
export function useCollapsible(options: CollapsibleOptions): CollapsibleContextValue {
  const id = useId()
  return useMachine(collapsibleMachine, collapsibleConnect, collapsibleEffects, { id, ...options })
}
