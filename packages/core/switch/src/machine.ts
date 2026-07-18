import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type { SwitchContext, SwitchMachineEvent, SwitchOptions, SwitchStateName } from './types'

/** The running switch machine — what a substrate holds and sends events to. */
export type SwitchMachine = Machine<SwitchStateName, SwitchContext, SwitchMachineEvent>

type SwitchAction = Action<SwitchContext, SwitchMachineEvent>
type SwitchGuard = Guard<SwitchContext, SwitchMachineEvent>

// Disabled gates user intent (`toggle`) only — programmatic `check`/`uncheck`
// stay open so a controlled consumer never desyncs while disabled.
const canToggle: SwitchGuard = ({ context }) => !context.disabled

const setDisabled: SwitchAction = ({ event, setContext }) => {
  if (event.type !== 'set.disabled') return
  setContext({ disabled: event.disabled })
}

const setPartPresence: SwitchAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function switchMachine(
  options: SwitchOptions,
): TransitionConfig<SwitchStateName, SwitchContext, SwitchMachineEvent> {
  // Annotated so createMachine infers Context as SwitchContext, not the narrowed literal.
  const context: SwitchContext = {
    disabled: options.disabled ?? false,
    // The substrate supplies a unique id; `switch` is only a bare fallback.
    id: options.id ?? 'switch',
    parts: { label: false },
  }

  return setup.as<SwitchContext, SwitchMachineEvent>().createMachine({
    initial: (options.checked ?? options.defaultChecked) === true ? 'checked' : 'unchecked',
    context,
    // Top-level: the disabled flag and part presence are settable from any state.
    on: {
      'set.disabled': { actions: setDisabled },
      'part.presence': { actions: setPartPresence },
    },
    states: {
      unchecked: {
        on: {
          toggle: { target: 'checked', guard: canToggle },
          check: { target: 'checked' },
        },
      },
      checked: {
        on: {
          toggle: { target: 'unchecked', guard: canToggle },
          uncheck: { target: 'unchecked' },
        },
      },
    },
  })
}
