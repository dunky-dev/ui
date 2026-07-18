import { setup, type Action, type Machine, type TransitionConfig } from '@dunky.dev/state-machine'
import type {
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options,
  __Name__StateName,
} from './types'

/** The running __name__ machine — what a substrate holds and sends events to. */
export type __Name__Machine = Machine<__Name__StateName, __Name__Context, __Name__MachineEvent>

type __Name__Action = Action<__Name__Context, __Name__MachineEvent>

// Each action performs exactly one setContext.
const setDisabled: __Name__Action = ({ event, setContext }) => {
  if (event.type !== 'SET_DISABLED') return
  setContext({ disabled: event.disabled })
}

// Option defaults are resolved HERE and seeded into context at build time —
// the machine never sees props; live callbacks flow through the connector.
// When parts cross-reference each other (aria-controls, labelledby), take a
// substrate-minted `id` option and derive the per-part ids in connect (see the
// dialog core).
export function __camelName__Machine(
  options: __Name__Options,
): TransitionConfig<__Name__StateName, __Name__Context, __Name__MachineEvent> {
  const context: __Name__Context = { disabled: options.disabled ?? false }

  return setup.as<__Name__Context, __Name__MachineEvent>().createMachine({
    initial: 'idle',
    context,
    // Any-state: the disabled flag is settable from a single top-level handler.
    on: {
      SET_DISABLED: { actions: setDisabled },
    },
    states: {
      idle: {},
    },
  })
}
