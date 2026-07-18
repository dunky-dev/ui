import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { checkboxMachine, checkboxConnect } from '@dunky.dev/checkbox'
import type { CheckboxOptions } from '@dunky.dev/checkbox'

import type { CheckboxContextValue } from './context'
import { checkboxEffects } from './effects'

export function useCheckbox(options: CheckboxOptions): CheckboxContextValue {
  const id = useId()
  return useMachine(checkboxMachine, checkboxConnect, checkboxEffects, { id, ...options })
}
