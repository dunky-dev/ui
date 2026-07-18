import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type {
  CollapsibleContext,
  CollapsibleMachineEvent,
  CollapsibleOptions,
  CollapsibleStateName,
} from './types'

/** The running collapsible machine — what a substrate holds and sends events to. */
export type CollapsibleMachine = Machine<
  CollapsibleStateName,
  CollapsibleContext,
  CollapsibleMachineEvent
>

type CollapsibleAction = Action<CollapsibleContext, CollapsibleMachineEvent>
type CollapsibleGuard = Guard<CollapsibleContext, CollapsibleMachineEvent>

// Disabled gates the user's toggle only — `open`/`close` are the consumer's
// own intent and stay ungated. See SPEC.md.
const canToggle: CollapsibleGuard = ({ context }) => !context.disabled

const setDisabled: CollapsibleAction = ({ event, setContext }) => {
  if (event.type !== 'disabled.set') return
  setContext({ disabled: event.disabled })
}

export function collapsibleMachine(
  options: CollapsibleOptions,
): TransitionConfig<CollapsibleStateName, CollapsibleContext, CollapsibleMachineEvent> {
  // Annotated so createMachine infers Context as CollapsibleContext, not the
  // narrowed literal.
  const context: CollapsibleContext = {
    disabled: options.disabled ?? false,
    // The substrate supplies a unique id; `collapsible` is only a bare fallback.
    id: options.id ?? 'collapsible',
  }

  return setup.as<CollapsibleContext, CollapsibleMachineEvent>().createMachine({
    initial: (options.open ?? options.defaultOpen) === true ? 'open' : 'closed',
    context,
    // Any-state: the disabled flag is settable from a single top-level handler.
    on: {
      'disabled.set': { actions: setDisabled },
    },
    states: {
      closed: {
        on: {
          open: { target: 'open' },
          toggle: { target: 'open', guard: canToggle },
        },
      },
      open: {
        on: {
          close: { target: 'closed' },
          toggle: { target: 'closed', guard: canToggle },
        },
      },
    },
  })
}
