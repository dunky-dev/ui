import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { radioMachine, radioConnect } from '@dunky.dev/radio'
import type { RadioOptions } from '@dunky.dev/radio'

import type { RadioContextValue } from './context'
import { radioEffects } from './effects'

export function useRadio(options: RadioOptions): RadioContextValue {
  const id = useId()
  return useMachine(radioMachine, radioConnect, radioEffects, { id, ...options })
}
