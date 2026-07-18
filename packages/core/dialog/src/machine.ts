import {
  and,
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type { DialogContext, DialogMachineEvent, DialogOptions, DialogStateName } from './types'

/** The running dialog machine — what a substrate holds and sends events to. */
export type DialogMachine = Machine<DialogStateName, DialogContext, DialogMachineEvent>

type DialogAction = Action<DialogContext, DialogMachineEvent>
type DialogGuard = Guard<DialogContext, DialogMachineEvent>

const isControlled: DialogGuard = ({ context }) => context.controlled
const canEscape: DialogGuard = ({ context }) => context.closeOnEscape
const canDismissOutside: DialogGuard = ({ context }) => context.closeOnInteractOutside
const syncOpens: DialogGuard = ({ event }) => event.type === 'controlled.sync' && event.open
const syncCloses: DialogGuard = ({ event }) => event.type === 'controlled.sync' && !event.open

// Every open/close intent lands in the mailbox; the connect's reaction turns
// it into onOpenChange. Uncontrolled, the intent rides along with the
// transition; controlled, the intent IS the outcome — the machine stays put
// until `controlled.sync` echoes the prop back.
const requestOpen: DialogAction = ({ setContext }) => setContext({ openIntent: { open: true } })
const requestClose: DialogAction = ({ setContext }) => setContext({ openIntent: { open: false } })

const setPartPresence: DialogAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function dialogMachine(
  options: DialogOptions,
): TransitionConfig<DialogStateName, DialogContext, DialogMachineEvent> {
  const role = options.role ?? 'dialog'
  // Annotated so createMachine infers Context as DialogContext, not the narrowed literal.
  const context: DialogContext = {
    role,
    modal: options.modal ?? true,
    closeOnEscape: options.closeOnEscape ?? true,
    // An alert dialog interrupts for a response — an outside press must not
    // dismiss it unless explicitly opted in.
    closeOnInteractOutside: options.closeOnInteractOutside ?? role === 'dialog',
    controlled: options.open !== undefined,
    openIntent: null,
    // The substrate supplies a unique id; `dialog` is only a bare fallback.
    id: options.id ?? 'dialog',
    parts: { title: false, description: false },
  }

  // Each intent event lists two candidates — first guard wins: controlled
  // only writes the mailbox; uncontrolled also takes the transition.
  return setup.as<DialogContext, DialogMachineEvent>().createMachine({
    initial: (options.open ?? options.defaultOpen) === true ? 'open' : 'closed',
    context,
    // Top-level: parts report their presence from any state.
    on: {
      'part.presence': { actions: setPartPresence },
    },
    states: {
      closed: {
        on: {
          open: [
            { guard: isControlled, actions: requestOpen },
            { target: 'open', actions: requestOpen },
          ],
          toggle: [
            { guard: isControlled, actions: requestOpen },
            { target: 'open', actions: requestOpen },
          ],
          'controlled.sync': { target: 'open', guard: syncOpens },
        },
      },
      open: {
        on: {
          close: [
            { guard: isControlled, actions: requestClose },
            { target: 'closed', actions: requestClose },
          ],
          toggle: [
            { guard: isControlled, actions: requestClose },
            { target: 'closed', actions: requestClose },
          ],
          escape: [
            { guard: and(canEscape, isControlled), actions: requestClose },
            { guard: canEscape, target: 'closed', actions: requestClose },
          ],
          'interact.outside': [
            { guard: and(canDismissOutside, isControlled), actions: requestClose },
            { guard: canDismissOutside, target: 'closed', actions: requestClose },
          ],
          'controlled.sync': { target: 'closed', guard: syncCloses },
        },
      },
    },
  })
}
