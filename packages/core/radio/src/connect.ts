import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  AttrBindings,
  EventBindings,
  KeyboardPayload,
} from '@dunky.dev/state-machine-bindings'
import { findItem } from './machine'
import type {
  RadioContext,
  RadioIds,
  RadioItemOptions,
  RadioItemState,
  RadioMachineEvent,
  RadioOptions,
  RadioStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` (checked/unchecked) and `data-disabled`
// are the styling/animation hooks.
export type RadioPartBindings = EventBindings &
  AttrBindings & {
    'data-state'?: RadioItemState
    'data-disabled'?: string
  } & Record<string, unknown>

/**
 * The per-item ids all derive from the one base id, so an item's `id` and its
 * label's cross-reference always agree — substrates that need an id outside
 * the connect (e.g. to move DOM focus) derive it through this same helper.
 */
export function radioIds(id: string): RadioIds {
  return {
    group: `${id}-group`,
    item: value => `${id}-item-${value}`,
    label: value => `${id}-label-${value}`,
  }
}

const NAVIGATION_KEYS: Record<string, 1 | -1 | undefined> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
}

// Roving tabindex: the checked item when it can take focus, otherwise the
// first enabled item; a disabled group offers none.
function tabbableValue(context: RadioContext): string | null {
  if (context.disabled) return null
  let first: string | null = null
  for (const item of context.items) {
    if (item.disabled) continue
    if (item.value === context.value) return item.value
    if (first === null) first = item.value
  }
  return first
}

/** The view-facing surface a driver reads from the running radio machine. */
export interface RadioApi {
  value: string | null
  disabled: boolean
  ids: RadioIds
  setValue: (value: string | null) => void
  parts: {
    group: RadioPartBindings
    item: (options: RadioItemOptions) => RadioPartBindings
    itemIndicator: (options: RadioItemOptions) => RadioPartBindings
    itemLabel: (options: RadioItemOptions) => RadioPartBindings
  }
}

export const radioConnect: Connect<
  RadioStateName,
  RadioContext,
  RadioMachineEvent,
  RadioOptions,
  RadioApi
> = ({ context, send }) => {
  const ids = radioIds(context.id)
  const tabbable = tabbableValue(context)

  const itemState = (value: string): RadioItemState =>
    context.value === value ? 'checked' : 'unchecked'

  return {
    value: context.value,
    disabled: context.disabled,
    ids,
    setValue(next) {
      if (context.value === next) return
      send({ type: 'value.set', value: next })
    },
    parts: {
      group: {
        role: 'radiogroup',
        id: ids.group,
        disabled: context.disabled || undefined,
        orientation: context.orientation,
        'data-disabled': context.disabled ? '' : undefined,
      },
      item({ value, disabled }) {
        const itemDisabled = context.disabled || disabled === true
        return {
          role: 'radio',
          id: ids.item(value),
          checked: context.value === value,
          disabled: itemDisabled || undefined,
          focusable: value === tabbable,
          // A dangling aria-labelledby id is an a11y defect — only while a
          // label for this value is rendered.
          labelledBy: context.labels[value] === true ? ids.label(value) : undefined,
          'data-state': itemState(value),
          'data-disabled': itemDisabled ? '' : undefined,
          // Asks for focus: not every browser focuses a pressed button
          // (Safari/Firefox on macOS), and arrow navigation must continue
          // from the pressed item.
          onPress: () => send({ type: 'select', value, focus: true }),
          onKeyDown: (event?: KeyboardPayload) => {
            const key = event?.key
            if (event === undefined || key === undefined) return
            const direction = NAVIGATION_KEYS[key]
            if (direction !== undefined) {
              // Arrows must move the roving focus, never scroll the page.
              event.preventDefault?.()
              send({ type: 'navigate', from: value, direction })
              return
            }
            if (key === ' ') {
              // Suppress the substrate's synthetic press so Space selects once.
              event.preventDefault?.()
              send({ type: 'select', value })
              return
            }
            // Radio groups don't act on Enter (APG) — suppressing it also keeps
            // an implicit form submission from firing under a keyboard user.
            if (key === 'Enter') event.preventDefault?.()
          },
        }
      },
      itemIndicator({ value, disabled }) {
        return {
          'data-state': itemState(value),
          'data-disabled': context.disabled || disabled === true ? '' : undefined,
        }
      },
      itemLabel({ value }) {
        const item = findItem(context.items, value)
        return {
          id: ids.label(value),
          'data-state': itemState(value),
          'data-disabled': context.disabled || item?.disabled === true ? '' : undefined,
          // Native label activation: pressing the label selects AND focuses
          // its item.
          onPress: () => send({ type: 'select', value, focus: true }),
        }
      },
    },
  }
}

const reaction = makeReaction<RadioStateName, RadioContext, RadioMachineEvent, RadioOptions>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
radioConnect.reactions = [
  reaction(
    m => m.context.value,
    (value, props) => props.onValueChange?.(value),
  ),
]
