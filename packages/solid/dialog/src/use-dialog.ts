import { createUniqueId, merge } from 'solid-js'
import { useMachine } from '@dunky.dev/solid-state-machine'
import { dialogMachine, dialogConnect } from '@dunky.dev/dialog'
import type { DialogApi, DialogMachine, DialogOptions } from '@dunky.dev/dialog'

import { solidDialogEffects } from './effects'

export function useDialog(options: DialogOptions): { api: DialogApi; machine: DialogMachine } {
  const id = createUniqueId()
  // `?? id` (via a live getter, not merge order): an explicit `id={undefined}`
  // must not knock out the generated fallback — ids also key the dialog stack,
  // so they must exist. `merge` keeps the rest of the options a reactive proxy.
  const props = merge(options, {
    get id() {
      return options.id ?? id
    },
  })
  return useMachine(dialogMachine, dialogConnect, solidDialogEffects, props)
}
