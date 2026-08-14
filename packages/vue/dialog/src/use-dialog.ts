import { useId, type ComputedRef } from 'vue'
import { useMachine } from '@dunky.dev/vue-state-machine'
import { dialogConnect, dialogMachine } from '@dunky.dev/dialog'
import type { DialogApi, DialogCallbacks, DialogMachine, DialogOptions } from '@dunky.dev/dialog'

import { vueDialogEffects } from './effects'

type DialogEmitEvent = 'update:open' | 'escapeKeyDown' | 'interactOutside' | 'backNavigation'
export type DialogEmit = (event: DialogEmitEvent, payload?: unknown) => void

export function useDialog(
  props: DialogOptions,
  emit: DialogEmit,
): { api: ComputedRef<DialogApi>; machine: DialogMachine } {
  const id = useId()
  // The core callbacks forward to emits: listeners run synchronously, so the
  // veto contract (payload.preventDefault) holds unchanged, and attach/detach
  // stays live without ever changing these wrappers' identity.
  const callbacks: DialogCallbacks = {
    onOpenChange: open => emit('update:open', open),
    onEscapeKeyDown: event => emit('escapeKeyDown', event),
    onInteractOutside: event => emit('interactOutside', event),
    onBackNavigation: event => emit('backNavigation', event),
  }
  // `?? id` (not spread order): an explicit `id: undefined` must not knock out
  // the generated fallback — ids also key the dialog stack, so they must exist.
  return useMachine(dialogMachine, dialogConnect, vueDialogEffects, () => ({
    ...props,
    ...callbacks,
    id: props.id ?? id,
  }))
}
