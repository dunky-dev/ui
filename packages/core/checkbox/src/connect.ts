import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  AttrBindings,
  EventBindings,
  KeyboardPayload,
} from '@dunky.dev/state-machine-bindings'
import type {
  CheckboxCheckedState,
  CheckboxContext,
  CheckboxIds,
  CheckboxMachineEvent,
  CheckboxOptions,
  CheckboxStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook;
// `data-disabled` (empty-valued, attribute-presence convention) marks the
// disabled surface.
export type CheckboxPartBindings = EventBindings &
  AttrBindings & {
    'data-state'?: CheckboxStateName
    'data-disabled'?: string
  } & Record<string, unknown>

// The cross-part ids both derive from the one base id, so the label's id and
// the control's aria-labelledby always agree.
function checkboxIds(id: string): CheckboxIds {
  return { control: `${id}-control`, label: `${id}-label` }
}

const checkedOf = (state: CheckboxStateName): CheckboxCheckedState =>
  state === 'indeterminate' ? 'indeterminate' : state === 'checked'

/** The view-facing surface a driver reads from the running checkbox machine. */
export interface CheckboxApi {
  checked: CheckboxCheckedState
  disabled: boolean
  ids: CheckboxIds
  setChecked: (checked: CheckboxCheckedState) => void
  parts: {
    control: CheckboxPartBindings
    indicator: CheckboxPartBindings
    label: CheckboxPartBindings
  }
}

export const checkboxConnect: Connect<
  CheckboxStateName,
  CheckboxContext,
  CheckboxMachineEvent,
  CheckboxOptions,
  CheckboxApi
> = ({ state, context, send }) => {
  const checked = checkedOf(state)
  const ids = checkboxIds(context.id)
  const dataDisabled = context.disabled ? '' : undefined
  const onToggle = (): void => send({ type: 'toggle' })

  return {
    checked,
    disabled: context.disabled,
    ids,
    setChecked(next) {
      if (checked === next) return
      send({ type: 'set.checked', checked: next })
    },
    parts: {
      control: {
        id: ids.control,
        role: 'checkbox',
        checked: state === 'indeterminate' ? 'mixed' : state === 'checked',
        // aria-disabled, not a native disabled attribute — the control stays
        // focusable/discoverable; the machine blocks the toggle. See SPEC.md.
        disabled: context.disabled || undefined,
        // A dangling aria-labelledby id is an a11y defect — only while rendered.
        labelledBy: context.parts.label ? ids.label : undefined,
        'data-state': state,
        'data-disabled': dataDisabled,
        onPress: onToggle,
        // Per APG, Space is the checkbox key — a button-backed control must
        // not toggle on Enter, so suppress the substrate's default activation.
        onKeyDown: (event?: KeyboardPayload) => {
          if (event?.key === 'Enter') event.preventDefault?.()
        },
      },
      indicator: {
        'data-state': state,
        'data-disabled': dataDisabled,
      },
      label: {
        id: ids.label,
        'data-state': state,
        'data-disabled': dataDisabled,
        // The label affordance: pressing it toggles; the machine gates disabled.
        onPress: onToggle,
      },
    },
  }
}

const reaction = makeReaction<
  CheckboxStateName,
  CheckboxContext,
  CheckboxMachineEvent,
  CheckboxOptions
>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
checkboxConnect.reactions = [
  // Selects the mailbox, not the state: the controlled re-sync moves state
  // without writing a token, so the consumer's own prop write never echoes.
  reaction(
    m => m.context.checkedChange,
    (change, props) => {
      if (change) props.onCheckedChange?.(change.checked)
    },
  ),
]
