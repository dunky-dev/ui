import {
  and,
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type { DrawerContext, DrawerMachineEvent, DrawerOptions, DrawerStateName } from './types'

/** The running drawer machine — what a substrate holds and sends events to. */
export type DrawerMachine = Machine<DrawerStateName, DrawerContext, DrawerMachineEvent>

type DrawerAction = Action<DrawerContext, DrawerMachineEvent>
type DrawerGuard = Guard<DrawerContext, DrawerMachineEvent>

const isControlled: DrawerGuard = ({ context }) => context.controlled
const canEscape: DrawerGuard = ({ context }) => context.closeOnEscape
const canDismissOutside: DrawerGuard = ({ context }) => context.closeOnInteractOutside
const syncOpens: DrawerGuard = ({ event }) => event.type === 'controlled.sync' && event.open
const syncCloses: DrawerGuard = ({ event }) => event.type === 'controlled.sync' && !event.open

// Every open/close intent lands in the mailbox; the connect's reaction turns
// it into onOpenChange. Uncontrolled, the intent rides along with the
// transition; controlled, the intent IS the outcome — the machine stays put
// until `controlled.sync` echoes the prop back.
const requestOpen: DrawerAction = ({ setContext }) => setContext({ openIntent: { open: true } })
const requestClose: DrawerAction = ({ setContext }) => setContext({ openIntent: { open: false } })

const setPartPresence: DrawerAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function drawerMachine(
  options: DrawerOptions,
): TransitionConfig<DrawerStateName, DrawerContext, DrawerMachineEvent> {
  // Annotated so createMachine infers Context as DrawerContext, not the narrowed literal.
  const context: DrawerContext = {
    // The trailing-edge convention drawers share.
    placement: options.placement ?? 'right',
    closeOnEscape: options.closeOnEscape ?? true,
    closeOnInteractOutside: options.closeOnInteractOutside ?? true,
    controlled: options.open !== undefined,
    openIntent: null,
    // The substrate supplies a unique id; `drawer` is only a bare fallback.
    id: options.id ?? 'drawer',
    parts: { title: false, description: false },
  }

  // Each intent event lists two candidates — first guard wins: controlled
  // only writes the mailbox; uncontrolled also takes the transition.
  return setup.as<DrawerContext, DrawerMachineEvent>().createMachine({
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
