import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { alertDialogMachine, alertDialogConnect } from '@dunky.dev/alert-dialog'
import type { AlertDialogOptions } from '@dunky.dev/alert-dialog'

import type { AlertDialogContextValue } from './context'
import { alertDialogEffects } from './effects'

export function useAlertDialog(options: AlertDialogOptions): AlertDialogContextValue {
  const id = useId()
  // `?? id` (not spread order): an explicit `id={undefined}` must not knock out
  // the generated fallback — ids also key the layer stack, so they must exist.
  return useMachine(alertDialogMachine, alertDialogConnect, alertDialogEffects, {
    ...options,
    id: options.id ?? id,
  })
}
