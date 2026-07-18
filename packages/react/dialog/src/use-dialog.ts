import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { dialogMachine, dialogConnect } from '@dunky.dev/dialog'
import type { DialogOptions } from '@dunky.dev/dialog'

import type { DialogContextValue } from './context'
import { dialogEffects } from './effects'

export function useDialog(options: DialogOptions): DialogContextValue {
  const id = useId()
  return useMachine(dialogMachine, dialogConnect, dialogEffects, { id, ...options })
}
