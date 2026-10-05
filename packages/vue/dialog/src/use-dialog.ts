import { toValue, useId, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useMachine } from '@dunky.dev/vue-state-machine'
import { dialogMachine, dialogConnect } from '@dunky.dev/dialog'
import type { DialogApi, DialogMachine, DialogOptions } from '@dunky.dev/dialog'
import { domDialogEffects } from '@dunky.dev/dom-dialog'

export function useDialog(options: MaybeRefOrGetter<DialogOptions>): {
  api: ComputedRef<DialogApi>
  machine: DialogMachine
} {
  const id = useId()
  // `?? id` (not spread order): an explicit `id: undefined` must not knock out
  // the generated fallback — ids also key the dialog stack, so they must exist.
  return useMachine(dialogMachine, dialogConnect, domDialogEffects, () => {
    const resolved = toValue(options)
    return { ...resolved, id: resolved.id ?? id }
  })
}
