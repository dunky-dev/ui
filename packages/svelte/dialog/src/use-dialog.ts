import { useMachine } from '@dunky.dev/svelte-state-machine'
import { dialogConnect, dialogMachine } from '@dunky.dev/dialog'
import type { DialogApi, DialogMachine, DialogOptions } from '@dunky.dev/dialog'
import { domDialogEffects } from '@dunky.dev/dom-dialog'

/**
 * Owns one dialog machine for the <Dialog> root. `id` is the root's
 * `$props.id()` — a rune only a component script can call — and the fallback
 * for the base id.
 */
export function useDialog(
  options: () => DialogOptions,
  id: string,
): { readonly api: DialogApi; readonly machine: DialogMachine } {
  return useMachine(dialogMachine, dialogConnect, domDialogEffects, () => {
    const props = options()
    // `?? id`, not spread order: an explicit `id={undefined}` must not knock
    // out the generated fallback — ids also key the dialog stack.
    return { ...props, id: props.id ?? id }
  })
}
