// Public + machine-facing types for the framework-agnostic radio primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type RadioStateName = 'idle'

/** The item-level styling state every item/indicator/label carries. */
export type RadioItemState = 'checked' | 'unchecked'

/** Presentational layout hint (`aria-orientation`); never gates navigation. */
export type RadioOrientation = 'horizontal' | 'vertical'

/** A registered item. The registry's order is the navigation order. */
export interface RadioItem {
  value: string
  disabled: boolean
}

/** What a substrate passes to the per-item part getters: the item's identity
 * and its own disabled prop (fresher than the registry on the render that
 * changes it). */
export interface RadioItemOptions {
  value: string
  disabled?: boolean
}

/**
 * The cross-part ids, derived from the one `id` on context: an item's `id`
 * and its label's `id`/labelled-by reference always agree because every
 * substrate derives them through the same helper.
 */
export interface RadioIds {
  group: string
  item: (value: string) => string
  label: (value: string) => string
}

export interface RadioContext {
  value: string | null
  disabled: boolean
  orientation: RadioOrientation | undefined
  // The base id (substrate-minted, SSR-safe); the connect derives the per-item
  // ids from it.
  id: string
  // Registered items, in registration order — the navigation order.
  items: RadioItem[]
  // Which item values currently have a rendered label, so an item only
  // references a label that exists.
  labels: Record<string, boolean>
  // Focus mailbox: navigation writes a fresh token here; the substrate reacts
  // by moving real focus to that item.
  focus: { value: string } | null
}

// `select`/`navigate` are user intents the machine gates; the `.set` events
// are unguarded prop-sync channels; the rest is registration.
export type RadioMachineEvent =
  | { type: 'select'; value: string; focus?: boolean }
  | { type: 'navigate'; from: string; direction: 1 | -1 }
  | { type: 'value.set'; value: string | null }
  | { type: 'disabled.set'; disabled: boolean }
  | { type: 'orientation.set'; orientation: RadioOrientation | undefined }
  | { type: 'item.register'; value: string; disabled: boolean }
  | { type: 'item.unregister'; value: string }
  | { type: 'label.presence'; value: string; present: boolean }

export interface RadioCallbacks {
  /** Fired on every value change with the new value. */
  onValueChange?: (value: string | null) => void
}

/**
 * The agnostic radio options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface RadioOptions extends RadioCallbacks {
  /** Base id for the radio's parts; the substrate supplies a unique, SSR-safe
   * one. The per-item ids (item/label) are derived from it. */
  id?: string
  /** Controlled checked value (`null` = no selection); every change is
   * reported through `onValueChange`. */
  value?: string | null
  /** Initial checked value for the uncontrolled group. @default null */
  defaultValue?: string | null
  /** Disables the whole group: no selection, no tabbable item. @default false */
  disabled?: boolean
  /** Layout hint exposed as `aria-orientation`; all arrow keys navigate
   * regardless. */
  orientation?: RadioOrientation
}
