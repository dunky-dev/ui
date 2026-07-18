import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  AttrBindings,
  EventBindings,
  KeyboardPayload,
} from '@dunky.dev/state-machine-bindings'
import type {
  SelectContext,
  SelectIds,
  SelectItemStateName,
  SelectMachineEvent,
  SelectOptions,
  SelectStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. The data attributes are the styling/animation hooks:
// `data-state` everywhere, plus presence hooks (`data-highlighted`,
// `data-disabled`, `data-placeholder`) rendered as empty strings.
export type SelectPartBindings = EventBindings &
  AttrBindings & {
    'data-state'?: SelectStateName | SelectItemStateName
    'data-highlighted'?: ''
    'data-disabled'?: ''
    'data-placeholder'?: ''
  } & Record<string, unknown>

// The cross-part ids all derive from the one base id, so the trigger's
// aria-controls, the listbox's id, and the option ids named by
// aria-activedescendant always agree.
export function selectIds(id: string): SelectIds {
  return { trigger: `${id}-trigger`, listbox: `${id}-listbox` }
}

// Option values are constrained (unique, no whitespace — see SPEC) exactly so
// this derivation yields valid, stable ids.
function optionId(id: string, value: string): string {
  return `${id}-option-${value}`
}

/** What a substrate item hands back to `parts.item` to get its bindings. */
export interface SelectItemBindingProps {
  value: string
  disabled?: boolean
}

/** The view-facing surface a driver reads from the running select machine. */
export interface SelectApi {
  open: boolean
  value: string | null
  highlightedValue: string | null
  disabled: boolean
  /** The selected option's registered label — what the Value part renders. */
  selectedLabel: string | null
  ids: SelectIds
  setOpen: (open: boolean) => void
  parts: {
    trigger: SelectPartBindings
    value: SelectPartBindings
    listbox: SelectPartBindings
    item: (props: SelectItemBindingProps) => SelectPartBindings
    itemIndicator: SelectPartBindings
  }
}

export const selectConnect: Connect<
  SelectStateName,
  SelectContext,
  SelectMachineEvent,
  SelectOptions,
  SelectApi
> = ({ state, context, send }) => {
  const open = state === 'open'
  const dataState: SelectStateName = open ? 'open' : 'closed'
  const ids = selectIds(context.id)
  const highlightedValue = context.highlightedValue

  let selectedLabel: string | null = null
  if (context.value !== null) {
    for (const item of context.items) {
      if (item.value === context.value) {
        selectedLabel = item.label
        break
      }
    }
  }

  // The whole keyboard model lives here — DOM focus stays on the trigger, so
  // every key arrives through this one handler and every substrate inherits
  // the same mapping. Handled keys cancel the substrate default (page scroll,
  // synthetic button click); Tab doesn't — focus must move on.
  const onTriggerKeyDown = (event?: KeyboardPayload): void => {
    if (event?.key === undefined) return
    const key = event.key
    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault?.()
        send({ type: 'open' })
      } else if (key === 'Home' || key === 'End') {
        // The APG closed-combobox Home/End: open with the highlight pinned to
        // the matching end.
        event.preventDefault?.()
        send({ type: key === 'Home' ? 'highlight.first' : 'highlight.last' })
      }
      return
    }
    switch (key) {
      case 'ArrowDown':
        event.preventDefault?.()
        send({ type: 'highlight.next' })
        return
      case 'ArrowUp':
        event.preventDefault?.()
        send({ type: 'highlight.prev' })
        return
      case 'Home':
        event.preventDefault?.()
        send({ type: 'highlight.first' })
        return
      case 'End':
        event.preventDefault?.()
        send({ type: 'highlight.last' })
        return
      case 'Enter':
        event.preventDefault?.()
        send({ type: 'select' })
        return
      case 'Escape':
        event.preventDefault?.()
        send({ type: 'close' })
        return
      case 'Tab':
        send({ type: 'close' })
        return
      default:
        // Any single character is a typeahead key (Space included — the
        // machine decides whether it joins the buffer or commits).
        if (key.length === 1) {
          event.preventDefault?.()
          send({ type: 'typeahead', char: key })
        }
    }
  }

  return {
    open,
    value: context.value,
    highlightedValue,
    disabled: context.disabled,
    selectedLabel,
    ids,
    setOpen(next) {
      if (open === next) return
      send({ type: next ? 'open' : 'close' })
    },
    parts: {
      trigger: {
        id: ids.trigger,
        role: 'combobox',
        hasPopup: 'listbox',
        expanded: open,
        // Always present: the listbox stays rendered while closed.
        controls: ids.listbox,
        // Announced, not removed: the trigger stays focusable when disabled.
        disabled: context.disabled || undefined,
        activeDescendant:
          open && highlightedValue !== null ? optionId(context.id, highlightedValue) : undefined,
        'data-state': dataState,
        'data-disabled': context.disabled ? '' : undefined,
        onPress: () => send({ type: 'toggle' }),
        onKeyDown: onTriggerKeyDown,
      },
      value: {
        'data-placeholder': context.value === null ? '' : undefined,
      },
      listbox: {
        id: ids.listbox,
        role: 'listbox',
        // Out of the accessibility tree while closed; the substrate hides it
        // visually.
        hidden: open ? undefined : true,
        'data-state': dataState,
      },
      item: itemProps => {
        const selected = context.value === itemProps.value
        const disabled = itemProps.disabled === true
        return {
          id: optionId(context.id, itemProps.value),
          role: 'option',
          selected,
          disabled: disabled || undefined,
          'data-state': selected ? 'selected' : 'unselected',
          'data-highlighted': highlightedValue === itemProps.value ? '' : undefined,
          'data-disabled': disabled ? '' : undefined,
          onPress: () => send({ type: 'select', value: itemProps.value }),
          onPointerMove: () => send({ type: 'highlight.set', value: itemProps.value }),
        }
      },
      // Selection is announced via aria-selected on the option; the visual
      // mark is decoration.
      itemIndicator: {
        hidden: true,
      },
    },
  }
}

const reaction = makeReaction<SelectStateName, SelectContext, SelectMachineEvent, SelectOptions>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract: value, then
// highlight, then open. See SPEC.md.
selectConnect.reactions = [
  reaction(
    m => m.context.value,
    (value, props) => props.onValueChange?.(value),
  ),
  reaction(
    m => m.context.highlightedValue,
    (value, props) => props.onHighlightChange?.(value),
  ),
  reaction(
    m => m.matches('open'),
    (open, props) => props.onOpenChange?.(open),
  ),
]
