// Public + machine-facing types for the framework-agnostic select primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type SelectStateName = 'closed' | 'open'

/** The per-option `data-state` values (the root states style via open/closed). */
export type SelectItemStateName = 'selected' | 'unselected'

/** One registered option: what a substrate reports from its item lifecycle. */
export interface SelectItem {
  value: string
  /** The text the typeahead matches and the Value part renders. */
  label: string
  disabled: boolean
}

/**
 * The cross-part ids, derived from the one `id` on context: the trigger's
 * aria-controls names the listbox, and aria-activedescendant names option ids
 * derived from the same base — the connect wires both sides.
 */
export interface SelectIds {
  trigger: string
  listbox: string
}

export interface SelectContext {
  disabled: boolean
  loop: boolean
  // The base id (substrate-minted, SSR-safe); the connect derives the per-part
  // ids from it.
  id: string
  value: string | null
  // The active option while open; always null while closed.
  highlightedValue: string | null
  // The rendered options, in registration order — that order is the
  // navigation order.
  items: SelectItem[]
  // The typeahead search state: the buffer and the last keystroke's timestamp
  // (ms). Owned by the machine so every substrate shares one matching model.
  typeaheadBuffer: string
  typeaheadTime: number
}

export type SelectMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  // `select` without a value commits the highlighted option.
  | { type: 'select'; value?: string }
  | { type: 'highlight.next' }
  | { type: 'highlight.prev' }
  | { type: 'highlight.first' }
  | { type: 'highlight.last' }
  | { type: 'highlight.set'; value: string }
  | { type: 'typeahead'; char: string }
  | { type: 'item.register'; item: SelectItem }
  | { type: 'item.unregister'; value: string }
  | { type: 'value.set'; value: string | null }
  | { type: 'disabled.set'; disabled: boolean }

export interface SelectCallbacks {
  /** Fired on every value change with the new value. */
  onValueChange?: (value: string | null) => void
  /** Fired on every open/close transition with the new value. */
  onOpenChange?: (open: boolean) => void
  /** Fired on every highlight move with the highlighted value (null for none). */
  onHighlightChange?: (value: string | null) => void
}

/**
 * The agnostic select options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface SelectOptions extends SelectCallbacks {
  /** Base id for the select's parts; the substrate supplies a unique, SSR-safe
   * one. The per-part and per-option ids are derived from it. */
  id?: string
  /** Controlled value; every change is reported through `onValueChange`. */
  value?: string | null
  /** Initial value for the uncontrolled select. */
  defaultValue?: string
  /** Controlled open state; every open/close intent is reported through `onOpenChange`. */
  open?: boolean
  /** Initial open state for the uncontrolled select. @default false */
  defaultOpen?: boolean
  /** Disables the whole select: the listbox can't open. @default false */
  disabled?: boolean
  /** Whether highlight navigation wraps around the ends. @default false */
  loop?: boolean
}
