import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type {
  CheckboxCheckedState,
  CheckboxContext,
  CheckboxMachineEvent,
  CheckboxOptions,
  CheckboxStateName,
} from './types'

/** The running checkbox machine — what a substrate holds and sends events to. */
export type CheckboxMachine = Machine<CheckboxStateName, CheckboxContext, CheckboxMachineEvent>

type CheckboxAction = Action<CheckboxContext, CheckboxMachineEvent>
type CheckboxGuard = Guard<CheckboxContext, CheckboxMachineEvent>

const isEnabled: CheckboxGuard = ({ context }) => !context.disabled

const setDisabled: CheckboxAction = ({ event, setContext }) => {
  if (event.type !== 'set.disabled') return
  setContext({ disabled: event.disabled })
}

const setPartPresence: CheckboxAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

// The onCheckedChange mailbox write: a fresh token per report, so a value that
// recurs (a toggle back after a silent sync) still fires the reaction.
const reportChange =
  (checked: CheckboxCheckedState): CheckboxAction =>
  ({ setContext }) =>
    setContext({ checkedChange: { checked } })

/** The state a checked value lands on — the initial pick and the set/sync
 * targets share it, and a substrate's controlled-sync compares through it. */
export function checkboxStateOf(checked: CheckboxCheckedState): CheckboxStateName {
  if (checked === 'indeterminate') return 'indeterminate'
  return checked ? 'checked' : 'unchecked'
}

export function checkboxMachine(
  options: CheckboxOptions,
): TransitionConfig<CheckboxStateName, CheckboxContext, CheckboxMachineEvent> {
  // Annotated so createMachine infers Context as CheckboxContext, not the narrowed literal.
  const context: CheckboxContext = {
    disabled: options.disabled ?? false,
    // The substrate supplies a unique id; `checkbox` is only a bare fallback.
    id: options.id ?? 'checkbox',
    parts: { label: false },
    checkedChange: null,
  }

  return setup.as<CheckboxContext, CheckboxMachineEvent>().createMachine({
    initial: checkboxStateOf(options.checked ?? options.defaultChecked ?? false),
    context,
    // Top-level: programmatic writes apply from any state — disabled gates the
    // user's toggle, never the consumer.
    on: {
      'set.checked': [
        {
          target: 'checked',
          guard: ({ event }) => event.checked === true,
          actions: reportChange(true),
        },
        {
          target: 'unchecked',
          guard: ({ event }) => event.checked === false,
          actions: reportChange(false),
        },
        { target: 'indeterminate', actions: reportChange('indeterminate') },
      ],
      // Same targets, no report: the value came from the consumer's controlled
      // prop, and echoing it back would feed a derived-value loop (see SPEC.md).
      'sync.checked': [
        { target: 'checked', guard: ({ event }) => event.checked === true },
        { target: 'unchecked', guard: ({ event }) => event.checked === false },
        { target: 'indeterminate' },
      ],
      'set.disabled': { actions: setDisabled },
      'part.presence': { actions: setPartPresence },
    },
    states: {
      unchecked: {
        on: {
          toggle: { target: 'checked', guard: isEnabled, actions: reportChange(true) },
        },
      },
      checked: {
        on: {
          toggle: { target: 'unchecked', guard: isEnabled, actions: reportChange(false) },
        },
      },
      // A consumer-set display state: a toggle always resolves it to checked,
      // never cycles back into it (APG mixed-state, minus the mixed stop).
      indeterminate: {
        on: {
          toggle: { target: 'checked', guard: isEnabled, actions: reportChange(true) },
        },
      },
    },
  })
}
