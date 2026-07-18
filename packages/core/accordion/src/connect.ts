import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  AttrBindings,
  EventBindings,
  KeyboardPayload,
} from '@dunky.dev/state-machine-bindings'
import type {
  AccordionContext,
  AccordionIds,
  AccordionItemOptions,
  AccordionMachineEvent,
  AccordionOptions,
  AccordionOrientation,
  AccordionStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook.
export type AccordionPartBindings = EventBindings &
  AttrBindings & { 'data-state'?: 'open' | 'closed' } & Record<string, unknown>

// The per-item ids all derive from the one base id plus the item value, so the
// trigger's aria-controls and the content's aria-labelledby always agree.
// The value is URI-encoded: an id must hold no whitespace, and aria-controls /
// aria-labelledby are IDREF lists, so a raw value like "item one" would split
// into two dangling references.
// Exported: the substrate's focus effect resolves the same trigger id.
export function accordionIds(id: string): AccordionIds {
  return {
    trigger: value => `${id}-trigger-${encodeURIComponent(value)}`,
    content: value => `${id}-content-${encodeURIComponent(value)}`,
  }
}

/** The view-facing surface a driver reads from the running accordion machine. */
export interface AccordionApi {
  value: string[]
  focusedValue: string | null
  orientation: AccordionOrientation
  disabled: boolean
  ids: AccordionIds
  setValue: (value: string[]) => void
  isItemOpen: (value: string) => boolean
  parts: {
    item: (item: AccordionItemOptions) => AccordionPartBindings
    header: (item: AccordionItemOptions) => AccordionPartBindings
    trigger: (item: AccordionItemOptions) => AccordionPartBindings
    content: (item: AccordionItemOptions) => AccordionPartBindings
  }
}

export const accordionConnect: Connect<
  AccordionStateName,
  AccordionContext,
  AccordionMachineEvent,
  AccordionOptions,
  AccordionApi
> = ({ context, send }) => {
  const ids = accordionIds(context.id)
  const orientation = context.orientation
  // The navigation axis follows orientation; cross-axis keys are left alone.
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
  const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'

  const isItemOpen = (value: string): boolean => context.value.includes(value)
  const isItemDisabled = (item: AccordionItemOptions): boolean =>
    context.disabled || item.disabled === true

  // Shared across triggers (it never reads the item). A disabled accordion
  // handles no navigation at all — the keys keep their page defaults.
  const onTriggerKeyDown = (event?: KeyboardPayload): void => {
    if (context.disabled) return
    switch (event?.key) {
      case nextKey:
        send({ type: 'focus.next' })
        break
      case previousKey:
        send({ type: 'focus.previous' })
        break
      case 'Home':
        send({ type: 'focus.first' })
        break
      case 'End':
        send({ type: 'focus.last' })
        break
      default:
        return
    }
    // The key was consumed for navigation — the page must not scroll.
    event.preventDefault?.()
  }

  // The shared styling hooks every part of an item carries.
  const itemAttrs = (item: AccordionItemOptions): AccordionPartBindings => ({
    'data-state': isItemOpen(item.value) ? 'open' : 'closed',
    'data-disabled': isItemDisabled(item) ? '' : undefined,
    'data-orientation': orientation,
  })

  return {
    // A copy, like every array crossing the boundary — a driver mutation must
    // not corrupt machine context.
    value: context.value.slice(),
    focusedValue: context.focusedValue,
    orientation,
    disabled: context.disabled,
    ids,
    isItemOpen,
    setValue(next) {
      send({ type: 'value.set', value: next })
    },
    parts: {
      item: itemAttrs,
      header: itemAttrs,
      trigger(item) {
        const bindings = itemAttrs(item)
        bindings.id = ids.trigger(item.value)
        bindings.controls = ids.content(item.value)
        bindings.expanded = isItemOpen(item.value)
        // The gate lives in the machine's toggle guard; aria-disabled keeps
        // the trigger perceivable (see SPEC.md — Design). Per APG, the open
        // trigger of a non-collapsible single accordion also announces as
        // disabled — presentation only: navigation still visits it and the
        // item's data-disabled is untouched.
        bindings.disabled =
          isItemDisabled(item) || (isItemOpen(item.value) && !context.collapsible) || undefined
        bindings.onPress = () => send({ type: 'toggle', value: item.value })
        bindings.onFocus = () => send({ type: 'focus.set', value: item.value })
        bindings.onBlur = () => send({ type: 'focus.clear' })
        bindings.onKeyDown = onTriggerKeyDown
        return bindings
      },
      content(item) {
        const bindings = itemAttrs(item)
        bindings.role = 'region'
        bindings.id = ids.content(item.value)
        bindings.labelledBy = ids.trigger(item.value)
        return bindings
      },
    },
  }
}

const reaction = makeReaction<
  AccordionStateName,
  AccordionContext,
  AccordionMachineEvent,
  AccordionOptions
>()

// The consumer speaks the mode's shape: the array for multiple, the single
// item (or null) for single. Multiple gets a copy — handing out the context
// array would let a consumer mutation corrupt the machine.
function reportValue(value: string[], props: AccordionOptions): void {
  if (props.type === 'multiple') props.onValueChange?.(value.slice())
  else props.onValueChange?.(value[0] ?? null)
}

// One reaction per consumer callback. Reactions fire in registration order —
// that order is the callback-order contract. See SPEC.md.
accordionConnect.reactions = [
  // Uncontrolled: the machine owns the value, every change reports. Under a
  // controlled value the selector pins to null so the driver's prop re-sync is
  // never echoed back at the consumer.
  reaction(
    m => (m.context.controlled ? null : m.context.value),
    (value, props) => {
      if (value !== null) reportValue(value, props)
    },
  ),
  // Controlled: each toggle reports the open set it asked for; the value
  // itself moves only when the prop comes back through value.set.
  reaction(
    m => m.context.valueIntent,
    (intent, props) => {
      if (intent !== null) reportValue(intent.value, props)
    },
  ),
]
