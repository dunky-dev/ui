import { useId } from 'react'
import { useMachine } from '@dunky.dev/native-state-machine'
import { dialogMachine, dialogConnect, dialogEffects } from '@dunky.dev/dialog'
import type { DialogApi, DialogMachine, DialogOptions } from '@dunky.dev/dialog'

// The core's substrate-free effects are the whole list here: native has no
// document-level Escape — the hardware back arrives through the Modal's
// `onRequestClose` in the Portal part instead.
export function useDialog(options: DialogOptions): { api: DialogApi; machine: DialogMachine } {
  const id = useId()
  // `?? id` (not spread order): an explicit `id={undefined}` must not knock out
  // the generated fallback — the cross-part ARIA ids derive from it.
  return useMachine(dialogMachine, dialogConnect, dialogEffects, {
    ...options,
    id: options.id ?? id,
  })
}
