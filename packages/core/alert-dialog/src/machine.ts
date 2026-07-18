import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type {
  AlertDialogContext,
  AlertDialogMachineEvent,
  AlertDialogOptions,
  AlertDialogStateName,
} from './types'

/** The running alert-dialog machine — what a substrate holds and sends events to. */
export type AlertDialogMachine = Machine<
  AlertDialogStateName,
  AlertDialogContext,
  AlertDialogMachineEvent
>

type AlertDialogAction = Action<AlertDialogContext, AlertDialogMachineEvent>
type AlertDialogGuard = Guard<AlertDialogContext, AlertDialogMachineEvent>

const isControlled: AlertDialogGuard = ({ context }) => context.controlled
const syncOpens: AlertDialogGuard = ({ event }) => event.type === 'controlled.sync' && event.open
const syncCloses: AlertDialogGuard = ({ event }) => event.type === 'controlled.sync' && !event.open

// Every open/close intent lands in the mailbox; the connect's reaction turns
// it into onOpenChange. Uncontrolled, the intent rides along with the
// transition; controlled, the intent IS the outcome — the machine stays put
// until `controlled.sync` echoes the prop back.
const requestOpen: AlertDialogAction = ({ setContext }) =>
  setContext({ openIntent: { open: true } })
const requestClose: AlertDialogAction = ({ setContext }) =>
  setContext({ openIntent: { open: false } })

const setPartPresence: AlertDialogAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function alertDialogMachine(
  options: AlertDialogOptions,
): TransitionConfig<AlertDialogStateName, AlertDialogContext, AlertDialogMachineEvent> {
  // Annotated so createMachine infers Context as AlertDialogContext, not the
  // narrowed literal.
  const context: AlertDialogContext = {
    controlled: options.open !== undefined,
    openIntent: null,
    // The substrate supplies a unique id; `alert-dialog` is only a bare fallback.
    id: options.id ?? 'alert-dialog',
    parts: { title: false, description: false },
  }

  // Each intent event lists two candidates — first guard wins: controlled
  // only writes the mailbox; uncontrolled also takes the transition.
  return setup.as<AlertDialogContext, AlertDialogMachineEvent>().createMachine({
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
          // Unguarded by any option: Escape always dismisses — the
          // per-occurrence veto runs in the substrate before this event is
          // sent. There is no outside-interaction transition at all.
          escape: [
            { guard: isControlled, actions: requestClose },
            { target: 'closed', actions: requestClose },
          ],
          'controlled.sync': { target: 'closed', guard: syncCloses },
        },
      },
    },
  })
}
