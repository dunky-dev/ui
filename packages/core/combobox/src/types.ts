// Public + machine-facing types for the framework-agnostic combobox primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.
import type { KeyboardPayload, PointerPayload } from '@dunky.dev/state-machine-bindings'

export type ComboboxStateName = 'closed' | 'open'

/** The per-item `data-state` values (the root states style via open/closed). */
export type ComboboxItemStateName = 'selected' | 'unselected'

/** One registered suggestion: what a substrate reports from its item lifecycle. */
export interface ComboboxItem {
  value: string
  /** The text committed to the input when this item is selected. */
  label: string
  disabled: boolean
}

/**
 * The cross-part ids, derived from the one `id` on context: the input's
 * aria-controls names the listbox, and aria-activedescendant names item ids
 * derived from the same base — the connect wires both sides.
 */
export interface ComboboxIds {
  input: string
  listbox: string
}

export interface ComboboxContext {
  disabled: boolean
  loop: boolean
  // The base id (substrate-minted, SSR-safe); the connect derives the per-part
  // ids from it.
  id: string
  value: string | null
  inputValue: string
  // The active suggestion while open; always null while closed, and optional
  // while open — the resting state while typing is "nothing highlighted".
  highlightedValue: string | null
  // The rendered suggestions, in rendered order: registrations carry their
  // position so the order survives filter-driven unmounts and remounts, and
  // in-place reorders of the rendered list.
  items: ComboboxItem[]
}

export type ComboboxMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  // Dismissal intents are distinct from `close` so vetoes route per cause.
  | { type: 'escape' }
  | { type: 'interact.outside' }
  // The user edited the input text.
  | { type: 'input'; value: string }
  // `select` without a value commits the highlighted suggestion.
  | { type: 'select'; value?: string }
  | { type: 'highlight.next' }
  | { type: 'highlight.prev' }
  | { type: 'highlight.set'; value: string }
  // `index` is the item's position among the rendered suggestions — a host
  // fact the substrate reports so navigation order matches the rendered order.
  | { type: 'item.register'; item: ComboboxItem; index?: number }
  | { type: 'item.unregister'; value: string }
  | { type: 'value.set'; value: string | null }
  | { type: 'inputValue.set'; value: string }
  | { type: 'disabled.set'; disabled: boolean }

export interface ComboboxCallbacks {
  /** Fired on every value change with the new value. */
  onValueChange?: (value: string | null) => void
  /** Fired on every input-text change with the new text. */
  onInputValueChange?: (value: string) => void
  /** Fired on every highlight move with the highlighted value (null for none). */
  onHighlightChange?: (value: string | null) => void
  /** Fired on every open/close transition with the new value. */
  onOpenChange?: (open: boolean) => void
  /** Fired before an Escape dismissal; `preventDefault()` vetoes it. */
  onEscapeKeyDown?: (event: KeyboardPayload) => void
  /** Fired before an outside-interaction dismissal; `preventDefault()` vetoes it. */
  onInteractOutside?: (event?: PointerPayload) => void
}

/**
 * The agnostic combobox options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface ComboboxOptions extends ComboboxCallbacks {
  /** Base id for the combobox's parts; the substrate supplies a unique,
   * SSR-safe one. The per-part and per-item ids are derived from it. */
  id?: string
  /** Controlled value; every change is reported through `onValueChange`. */
  value?: string | null
  /** Initial value for the uncontrolled combobox. */
  defaultValue?: string
  /** Controlled input text; every change is reported through `onInputValueChange`. */
  inputValue?: string
  /** Initial input text for the uncontrolled combobox. @default '' */
  defaultInputValue?: string
  /** Controlled open state; every open/close intent is reported through `onOpenChange`. */
  open?: boolean
  /** Initial open state for the uncontrolled combobox. @default false */
  defaultOpen?: boolean
  /** Disables the whole combobox: the listbox can't open. @default false */
  disabled?: boolean
  /** Whether arrow-key navigation wraps around the ends. @default false */
  loop?: boolean
}
