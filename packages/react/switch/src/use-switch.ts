import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { switchMachine, switchConnect } from '@dunky.dev/switch'
import type { SwitchOptions } from '@dunky.dev/switch'

import type { SwitchContextValue } from './context'
import { switchEffects } from './effects'

/**
 * Owns one switch machine for the <Switch> root. `useMachine` creates it
 * once (StrictMode-safe), re-syncs options each render, runs the substrate
 * effects, and exposes the connected api.
 */
export function useSwitch(options: SwitchOptions): SwitchContextValue {
  const id = useId()
  return useMachine(switchMachine, switchConnect, switchEffects, { id, ...options })
}
