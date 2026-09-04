import type { DialogMachine } from '@dunky.dev/dialog'
import type { TrapFocusOptions } from '@dunky.dev/dom-focus-trap'
import { foreignPopupHoldsFocus, isTopmostLayer } from '@dunky.dev/dom-overlay'

/**
 * The trap configuration for a dialog window, for whichever hook the substrate
 * wraps `trapFocus` in. Both getters are read per Tab press — so they follow
 * the machine and the stack without re-binding the listener — which is why
 * `closeId` is an accessor: the api it comes from is re-created per render.
 */
export function dialogTrapOptions(machine: DialogMachine, closeId: () => string): TrapFocusOptions {
  return {
    // Only a modal dialog traps, and only while topmost — a nested dialog
    // owns focus while open, and so does a popup inside the dialog that holds
    // it without having joined the stack.
    enabled: () =>
      machine.context.modal &&
      isTopmostLayer(machine.context.id) &&
      !foreignPopupHoldsFocus(machine.context.id),
    // The Close part is the cycle's last stop wherever it renders (core
    // SPEC); found by its derived id.
    last: () => document.getElementById(closeId()),
  }
}
