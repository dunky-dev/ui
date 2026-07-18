import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { selectMachine, selectConnect } from '@dunky.dev/select'
import type { SelectOptions } from '@dunky.dev/select'

import type { SelectContextValue } from './context'
import { selectEffects } from './effects'

export function useSelect(options: SelectOptions): SelectContextValue {
  const id = useId()
  return useMachine(selectMachine, selectConnect, selectEffects, { id, ...options })
}
