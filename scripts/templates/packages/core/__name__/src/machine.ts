import { setup, type Action, type Guard, type Machine, type TransitionConfig } from '@dunky.dev/state-machine'
import type {
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options,
  __Name__StateName,
} from './types'

/** The running __name__ machine — what a substrate holds and sends events to. */
export type __Name__Machine = Machine<__Name__StateName, __Name__Context, __Name__MachineEvent>

type __Name__Action = Action<__Name__Context, __Name__MachineEvent>
type __Name__Guard = Guard<__Name__Context, __Name__MachineEvent>

// Emit onActivate by writing a fresh token; the connector reaction fires on the
// reference change (see connect.ts). Each action performs exactly one setContext.
const activate: __Name__Action = ({ setContext }) => setContext({ activateEvent: {} })

const disable: __Name__Action = ({ setContext }) => setContext({ disabled: true })
const enable: __Name__Action = ({ setContext }) => setContext({ disabled: false })

const notDisabled: __Name__Guard = ({ context }) => !context.disabled
const isDisableEvent: __Name__Guard = ({ event }) =>
  event.type === 'SET_DISABLED' && event.disabled === true

// Option defaults are resolved HERE and seeded into context at build time —
// the machine never sees props; live callbacks flow through the connector.
// When parts need cross-referencing ids (aria-controls, labelledby), take a
// substrate-minted `ids` argument and seed it into context (see the dialog core).
export function create__Name__Config(
  options: __Name__Options,
): TransitionConfig<__Name__StateName, __Name__Context, __Name__MachineEvent> {
  // Annotated so createMachine infers Context as __Name__Context, not the narrowed literal.
  const context: __Name__Context = {
    disabled: options.disabled ?? false,
    activateEvent: null,
  }

  return setup.as<__Name__Context, __Name__MachineEvent>().createMachine({
    initial: 'idle',
    context,
    states: {
      idle: {
        on: {
          ACTIVATE: { guard: notDisabled, actions: activate },
        },
      },
    },
    on: {
      SET_DISABLED: [{ guard: isDisableEvent, actions: disable }, { actions: enable }],
    },
  })
}
