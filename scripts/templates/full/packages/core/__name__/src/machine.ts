import { setup, type Action, type Guard, type TransitionConfig } from '@dunky.dev/state-machine'
import type {
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options,
  __Name__StateName,
} from './types'

// TODO(spec): replace this placeholder lifecycle with the real statechart. The
// skeleton models a single `idle` state that activates in place — enough to
// compile, test, and drive end-to-end. Describe the intended behavior in
// SPECS.md first, then grow the states/transitions to match it.

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
