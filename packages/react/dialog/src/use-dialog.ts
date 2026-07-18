import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { dialogMachine, dialogConnect } from '@dunky.dev/dialog'
import type { DialogOptions } from '@dunky.dev/dialog'

import type { DialogContextValue } from './context'
import { dialogEffects } from './effects'

export function useDialog(options: DialogOptions): DialogContextValue {
  const id = useId()
  // `?? id` (not spread order): an explicit `id={undefined}` must not knock out
  // the generated fallback — ids also key the dialog stack, so they must exist.
  return useMachine(dialogMachine, dialogConnect, dialogEffects, {
    ...options,
    id: options.id ?? id,
  })
}
