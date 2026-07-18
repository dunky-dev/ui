import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  AttrBindings,
  EventBindings,
  KeyboardPayload,
  PointerPayload,
} from '@dunky.dev/state-machine-bindings'
import type {
  ComboboxContext,
  ComboboxIds,
  ComboboxItemStateName,
  ComboboxMachineEvent,
  ComboboxOptions,
  ComboboxStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. The data attributes are the styling/animation hooks:
// `data-state` everywhere, plus presence hooks (`data-highlighted`,
// `data-disabled`) rendered as empty strings.
export type ComboboxPartBindings = EventBindings &
  AttrBindings & {
    'data-state'?: ComboboxStateName | ComboboxItemStateName
    'data-highlighted'?: ''
    'data-disabled'?: ''
  } & Record<string, unknown>

// The cross-part ids all derive from the one base id, so the input's
// aria-controls, the listbox's id, and the item ids named by
// aria-activedescendant always agree.
function comboboxIds(id: string): ComboboxIds {
  return { input: `${id}-input`, listbox: `${id}-listbox` }
}

// Item values are constrained (unique, no whitespace — see SPEC) exactly so
// this derivation yields valid, stable ids.
function itemId(id: string, value: string): string {
  return `${id}-item-${value}`
}

/** What a substrate item hands back to `parts.item` to get its bindings. */
export interface ComboboxItemBindingProps {
  value: string
  disabled?: boolean
}

/** The view-facing surface a driver reads from the running combobox machine. */
export interface ComboboxApi {
  open: boolean
  value: string | null
  inputValue: string
  highlightedValue: string | null
  disabled: boolean
  ids: ComboboxIds
  setOpen: (open: boolean) => void
  /**
   * Report a detected outside interaction. A combobox has no backdrop to catch
   * presses, so detection is substrate work; this is where the intent enters —
   * the consumer's veto handler fires first, then the machine gates dismissal.
   */
  onInteractOutside: (event?: PointerPayload) => void
  parts: {
    input: ComboboxPartBindings
    trigger: ComboboxPartBindings
    listbox: ComboboxPartBindings
    item: (props: ComboboxItemBindingProps) => ComboboxPartBindings
    itemIndicator: ComboboxPartBindings
  }
}

export const comboboxConnect: Connect<
  ComboboxStateName,
  ComboboxContext,
  ComboboxMachineEvent,
  ComboboxOptions,
  ComboboxApi
> = ({ state, context, props, send }) => {
  const open = state === 'open'
  const dataState: ComboboxStateName = open ? 'open' : 'closed'
  const ids = comboboxIds(context.id)
  const highlightedValue = context.highlightedValue

  // The keyboard model lives here — DOM focus stays in the input, so every
  // key arrives through this one handler and every substrate inherits the
  // same mapping. Arrow keys cancel the substrate default (caret move, page
  // scroll); Enter only while open (no form submit mid-interaction); Home/End
  // keep their native caret behavior; Escape is a document-level layer
  // concern, not the input's.
  const onInputKeyDown = (event?: KeyboardPayload): void => {
    if (event?.key === undefined) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault?.()
        send({ type: 'highlight.next' })
        return
      case 'ArrowUp':
        event.preventDefault?.()
        send({ type: 'highlight.prev' })
        return
      case 'Enter':
        if (!open) return
        event.preventDefault?.()
        send({ type: 'select' })
        return
    }
  }

  return {
    open,
    value: context.value,
    inputValue: context.inputValue,
    highlightedValue,
    disabled: context.disabled,
    ids,
    setOpen(next) {
      if (open === next) return
      send({ type: next ? 'open' : 'close' })
    },
    // An outside interaction is an intent, not a close command: the consumer
    // may veto it; whether it dismisses is decided in the machine.
    onInteractOutside(event) {
      props.onInteractOutside?.(event)
      if (event?.defaultPrevented !== true) send({ type: 'interact.outside' })
    },
    parts: {
      input: {
        id: ids.input,
        role: 'combobox',
        autoComplete: 'list',
        expanded: open,
        // Always present: the listbox stays rendered while closed.
        controls: ids.listbox,
        // Announced here; enforcing text entry is the substrate's native concern.
        disabled: context.disabled || undefined,
        activeDescendant:
          open && highlightedValue !== null ? itemId(context.id, highlightedValue) : undefined,
        'data-state': dataState,
        'data-disabled': context.disabled ? '' : undefined,
        onValueChange: event => {
          if (typeof event?.value === 'string') send({ type: 'input', value: event.value })
        },
        onKeyDown: onInputKeyDown,
      },
      trigger: {
        hasPopup: 'listbox',
        expanded: open,
        controls: ids.listbox,
        disabled: context.disabled || undefined,
        // Not a tab stop: the input is the one place keyboard focus lives.
        focusable: false,
        'data-state': dataState,
        'data-disabled': context.disabled ? '' : undefined,
        onPress: () => send({ type: 'toggle' }),
        // Pressing the trigger must not blur the input, even transiently — it
        // is a caret on the input's popup, not a focus target.
        onPointerDown: event => event?.preventDefault?.(),
      },
      listbox: {
        id: ids.listbox,
        role: 'listbox',
        // Out of the accessibility tree while closed; the substrate hides it
        // visually.
        hidden: open ? undefined : true,
        'data-state': dataState,
        // A press on the surface itself — padding, gaps between options —
        // must not move DOM focus out of the input: the whole interaction
        // lives on the activedescendant model.
        onPointerDown: event => event?.preventDefault?.(),
      },
      item: itemProps => {
        const selected = context.value === itemProps.value
        const disabled = itemProps.disabled === true
        return {
          id: itemId(context.id, itemProps.value),
          role: 'option',
          selected,
          disabled: disabled || undefined,
          'data-state': selected ? 'selected' : 'unselected',
          'data-highlighted': highlightedValue === itemProps.value ? '' : undefined,
          'data-disabled': disabled ? '' : undefined,
          onPress: () => send({ type: 'select', value: itemProps.value }),
          onPointerMove: () => send({ type: 'highlight.set', value: itemProps.value }),
          // A press must not steal DOM focus from the input — the whole
          // interaction lives on the activedescendant model.
          onPointerDown: event => event?.preventDefault?.(),
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

const reaction = makeReaction<
  ComboboxStateName,
  ComboboxContext,
  ComboboxMachineEvent,
  ComboboxOptions
>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract: value, then
// input text, then highlight, then open. See SPEC.md.
comboboxConnect.reactions = [
  reaction(
    m => m.context.value,
    (value, props) => props.onValueChange?.(value),
  ),
  reaction(
    m => m.context.inputValue,
    (value, props) => props.onInputValueChange?.(value),
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
