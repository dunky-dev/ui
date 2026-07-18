// Public + machine-facing types for the framework-agnostic checkbox primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type CheckboxStateName = 'unchecked' | 'checked' | 'indeterminate'

/** The consumer-facing value: the two binary stops plus the mixed display state. */
export type CheckboxCheckedState = boolean | 'indeterminate'

/** The parts whose presence drives the ARIA relationships on Control. */
export type CheckboxPart = 'label'

/**
 * The cross-part ids, derived from the one `id` on context: the label renders
 * its id, the control references it as aria-labelledby, and the connect wires
 * both sides.
 */
export interface CheckboxIds {
  control: string
  label: string
}

export interface CheckboxContext {
  disabled: boolean
  // The base id (substrate-minted, SSR-safe); the connect derives the per-part
  // ids from it.
  id: string
  // Which optional parts are currently present, so Control only references the
  // ones actually rendered.
  parts: Record<CheckboxPart, boolean>
  // Mailbox for onCheckedChange: reportable transitions write a fresh token so
  // the reaction fires even when a value recurs, while `sync.checked` writes
  // none — the consumer's own controlled write is never echoed back.
  checkedChange: { checked: CheckboxCheckedState } | null
}

// `toggle` is user intent, gated by disabled; `set.checked` / `set.disabled`
// are programmatic writes and are never gated. `sync.checked` is the
// substrate's controlled re-sync: it applies the value like `set.checked` but
// silently — the prop's own write never reports through onCheckedChange.
export type CheckboxMachineEvent =
  | { type: 'toggle' }
  | { type: 'set.checked'; checked: CheckboxCheckedState }
  | { type: 'sync.checked'; checked: CheckboxCheckedState }
  | { type: 'set.disabled'; disabled: boolean }
  | { type: 'part.presence'; part: CheckboxPart; present: boolean }

export interface CheckboxCallbacks {
  /** Fired with the new value on user toggles and programmatic sets — never as
   * an echo of the controlled `checked` prop. */
  onCheckedChange?: (checked: CheckboxCheckedState) => void
}

/**
 * The agnostic checkbox options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface CheckboxOptions extends CheckboxCallbacks {
  /** Base id for the checkbox's parts; the substrate supplies a unique,
   * SSR-safe one. The per-part ids (control/label) are derived from it. */
  id?: string
  /** Controlled checked state; value transitions report through
   * `onCheckedChange`, but re-syncing this prop is never echoed back. */
  checked?: CheckboxCheckedState
  /** Initial checked state for the uncontrolled checkbox. @default false */
  defaultChecked?: CheckboxCheckedState
  /** Blocks toggling — user intent only; programmatic updates still apply.
   * @default false */
  disabled?: boolean
}
