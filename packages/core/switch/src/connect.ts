import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type { AttrBindings, EventBindings } from '@dunky.dev/state-machine-bindings'
import type {
  SwitchContext,
  SwitchIds,
  SwitchMachineEvent,
  SwitchOptions,
  SwitchStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook;
// `data-disabled` is present (empty) while disabled, absent otherwise.
export type SwitchPartBindings = EventBindings &
  AttrBindings & { 'data-state'?: SwitchStateName; 'data-disabled'?: string } & Record<
    string,
    unknown
  >

// The cross-part ids derive from the one base id, so the Control's
// aria-labelledby and the Label's id always agree.
function switchIds(id: string): SwitchIds {
  return { control: `${id}-control`, label: `${id}-label` }
}

/** The view-facing surface a driver reads from the running switch machine. */
export interface SwitchApi {
  checked: boolean
  disabled: boolean
  ids: SwitchIds
  setChecked: (checked: boolean) => void
  parts: {
    control: SwitchPartBindings
    thumb: SwitchPartBindings
    label: SwitchPartBindings
  }
}

export const switchConnect: Connect<
  SwitchStateName,
  SwitchContext,
  SwitchMachineEvent,
  SwitchOptions,
  SwitchApi
> = ({ state, context, send }) => {
  const checked = state === 'checked'
  const dataState: SwitchStateName = checked ? 'checked' : 'unchecked'
  const dataDisabled = context.disabled ? '' : undefined
  const ids = switchIds(context.id)

  // Control press and label press are the same user intent; whether it flips
  // the state is gated in the machine (disabled).
  const toggle = (): void => send({ type: 'toggle' })

  return {
    checked,
    disabled: context.disabled,
    ids,
    setChecked(next) {
      if (checked === next) return
      send({ type: next ? 'check' : 'uncheck' })
    },
    parts: {
      control: {
        role: 'switch',
        id: ids.control,
        // Always present, true or false — the switch is binary, never mixed.
        checked,
        disabled: context.disabled || undefined,
        // A dangling aria-labelledby id is an a11y defect — only while rendered.
        labelledBy: context.parts.label ? ids.label : undefined,
        'data-state': dataState,
        'data-disabled': dataDisabled,
        onPress: toggle,
      },
      thumb: {
        'data-state': dataState,
        'data-disabled': dataDisabled,
      },
      label: {
        id: ids.label,
        'data-state': dataState,
        'data-disabled': dataDisabled,
        onPress: toggle,
      },
    },
  }
}

const reaction = makeReaction<SwitchStateName, SwitchContext, SwitchMachineEvent, SwitchOptions>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
switchConnect.reactions = [
  reaction(
    m => m.matches('checked'),
    (checked, props) => props.onCheckedChange?.(checked),
  ),
]
