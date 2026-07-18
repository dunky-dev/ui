// Public + machine-facing types for the framework-agnostic accordion primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type AccordionStateName = 'idle' | 'focused'

export type AccordionType = 'single' | 'multiple'

export type AccordionOrientation = 'horizontal' | 'vertical'

/** An item's identity + disabled flag: what it registers with the machine and
 * what the connect's part functions take to scope bindings to one item. */
export interface AccordionItemOptions {
  value: string
  disabled?: boolean
}

/**
 * The per-item id factories, derived from the one `id` on context plus the
 * item's value: each renders as `id` on one element and as an ARIA reference
 * (aria-controls / aria-labelledby) on the other, and the connect wires both
 * sides.
 */
export interface AccordionIds {
  trigger: (value: string) => string
  content: (value: string) => string
}

export interface AccordionContext {
  type: AccordionType
  // Resolved per mode at build time: `multiple` is inherently collapsible, so
  // the toggle guard only ever reads this flag.
  collapsible: boolean
  // Fixed at build time: a controlled `value` is authoritative, so a toggle
  // reports intent through `valueIntent` instead of moving the open set.
  controlled: boolean
  disabled: boolean
  orientation: AccordionOrientation
  // The base id (substrate-minted, SSR-safe); the connect derives the per-item
  // ids from it.
  id: string
  /** The canonical open set — `single` mode holds at most one entry. */
  value: string[]
  /** Registered items in registration order — the keyboard navigation order. */
  items: AccordionItemOptions[]
  /** The value of the trigger that currently holds focus. */
  focusedValue: string | null
  /** Focus mailbox: a fresh token per navigation move, for the substrate to
   * carry to the platform — even when the target repeats. */
  focusTarget: { value: string } | null
  /** Intent mailbox for the controlled accordion: the open set a toggle asked
   * for — a fresh token per press, reported through `onValueChange` while the
   * value itself waits for the prop. */
  valueIntent: { value: string[] } | null
}

// Navigation intents are distinct events (not payloads) so the focused state
// alone handles them; toggling and registration stay any-state.
export type AccordionMachineEvent =
  | { type: 'toggle'; value: string }
  | { type: 'value.set'; value: string[] }
  | { type: 'item.register'; value: string; disabled?: boolean }
  | { type: 'item.unregister'; value: string }
  | { type: 'focus.set'; value: string }
  | { type: 'focus.clear' }
  | { type: 'focus.next' }
  | { type: 'focus.previous' }
  | { type: 'focus.first' }
  | { type: 'focus.last' }
  | { type: 'disabled.set'; disabled: boolean }
  | { type: 'orientation.set'; orientation: AccordionOrientation }

interface AccordionBaseOptions {
  /** Base id for the accordion's parts; the substrate supplies a unique,
   * SSR-safe one. The per-item ids derive from it plus the item value. */
  id?: string
  /** Disables every item. @default false */
  disabled?: boolean
  /** The arrow-key navigation axis. @default 'vertical' */
  orientation?: AccordionOrientation
}

export interface AccordionSingleOptions extends AccordionBaseOptions {
  /** At most one item open; the value is one string or `null`. */
  type: 'single'
  /** Controlled open value — authoritative: presses report intent through
   * `onValueChange` and the accordion follows this prop. */
  value?: string | null
  /** Initial open value for the uncontrolled accordion. @default null */
  defaultValue?: string | null
  /** Whether re-pressing the open item's trigger closes it. @default false */
  collapsible?: boolean
  /** Reports the next value: the change made (uncontrolled) or the change a
   * press asked for (controlled). */
  onValueChange?: (value: string | null) => void
}

export interface AccordionMultipleOptions extends AccordionBaseOptions {
  /** Any number of items open; the value is a string array. */
  type: 'multiple'
  /** Controlled open value — authoritative: presses report intent through
   * `onValueChange` and the accordion follows this prop. */
  value?: string[]
  /** Initial open value for the uncontrolled accordion. @default [] */
  defaultValue?: string[]
  /** Reports the next value: the change made (uncontrolled) or the change a
   * press asked for (controlled). */
  onValueChange?: (value: string[]) => void
}

/**
 * The agnostic accordion options — the behavior a consumer configures. The
 * `type` discriminant picks the value shape (see SPEC.md — Design). A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export type AccordionOptions = AccordionSingleOptions | AccordionMultipleOptions
