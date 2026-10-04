import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { dialogMachine, dialogConnect } from '@dunky.dev/dialog'
import type { DialogApi, DialogMachine, DialogOptions } from '@dunky.dev/dialog'
import { domDialogEffects } from '@dunky.dev/dom-dialog'

export function useDialog(options: DialogOptions): { api: DialogApi; machine: DialogMachine } {
  const id = useId()
  // `?? id` (not spread order): an explicit `id={undefined}` must not knock out
  // the generated fallback — ids also key the dialog stack, so they must exist.
  return useMachine(dialogMachine, dialogConnect, domDialogEffects, {
    ...options,
    id: options.id ?? id,
  })
}
