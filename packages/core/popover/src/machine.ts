import {
  and,
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type { PopoverContext, PopoverMachineEvent, PopoverOptions, PopoverStateName } from './types'

/** The running popover machine — what a substrate holds and sends events to. */
export type PopoverMachine = Machine<PopoverStateName, PopoverContext, PopoverMachineEvent>

type PopoverAction = Action<PopoverContext, PopoverMachineEvent>
type PopoverGuard = Guard<PopoverContext, PopoverMachineEvent>

const isControlled: PopoverGuard = ({ context }) => context.controlled
const canEscape: PopoverGuard = ({ context }) => context.closeOnEscape
const canDismissOutside: PopoverGuard = ({ context }) => context.closeOnInteractOutside
const syncOpens: PopoverGuard = ({ event }) => event.type === 'controlled.sync' && event.open
const syncCloses: PopoverGuard = ({ event }) => event.type === 'controlled.sync' && !event.open

// Every open/close intent lands in the mailbox; the connect's reaction turns
// it into onOpenChange. Uncontrolled, the intent rides along with the
// transition; controlled, the intent IS the outcome — the machine stays put
// until `controlled.sync` echoes the prop back.
const requestOpen: PopoverAction = ({ setContext }) => setContext({ openIntent: { open: true } })
const requestClose: PopoverAction = ({ setContext }) => setContext({ openIntent: { open: false } })

const setPartPresence: PopoverAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function popoverMachine(
  options: PopoverOptions,
): TransitionConfig<PopoverStateName, PopoverContext, PopoverMachineEvent> {
  // Annotated so createMachine infers Context as PopoverContext, not the narrowed literal.
  const context: PopoverContext = {
    // Non-modal is the default — a popover coexists with the page (see SPEC).
    modal: options.modal ?? false,
    closeOnEscape: options.closeOnEscape ?? true,
    closeOnInteractOutside: options.closeOnInteractOutside ?? true,
    controlled: options.open !== undefined,
    openIntent: null,
    // The substrate supplies a unique id; `popover` is only a bare fallback.
    id: options.id ?? 'popover',
    parts: { title: false, description: false },
  }

  // Each intent event lists two candidates — first guard wins: controlled
  // only writes the mailbox; uncontrolled also takes the transition.
  return setup.as<PopoverContext, PopoverMachineEvent>().createMachine({
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
