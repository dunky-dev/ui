// Public + machine-facing types for the framework-agnostic switch primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type SwitchStateName = 'checked' | 'unchecked'

/** The parts whose presence drives the ARIA relationships on Control. */
export type SwitchPart = 'label'

/**
 * The cross-part ids, derived from the one `id` on context: the label's id
 * renders on the Label and as `aria-labelledby` on the Control, and the
 * connect wires both sides.
 */
export interface SwitchIds {
  control: string
  label: string
}

export interface SwitchContext {
  disabled: boolean
  // The base id (substrate-minted, SSR-safe); the connect derives the per-part
  // ids from it.
  id: string
  // Which optional parts are currently present, so Control only references the
  // ones actually rendered.
  parts: Record<SwitchPart, boolean>
}

// `toggle` is the user intent (gated on disabled in the machine);
// `check`/`uncheck` are programmatic and bypass the gate so a controlled
// consumer can sync while disabled.
export type SwitchMachineEvent =
  | { type: 'toggle' }
  | { type: 'check' }
  | { type: 'uncheck' }
  | { type: 'set.disabled'; disabled: boolean }
  | { type: 'part.presence'; part: SwitchPart; present: boolean }

export interface SwitchCallbacks {
  /** Fired on every checked/unchecked transition with the new value. */
  onCheckedChange?: (checked: boolean) => void
}

/**
 * The agnostic switch options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface SwitchOptions extends SwitchCallbacks {
  /** Base id for the switch's parts; the substrate supplies a unique, SSR-safe
   * one. The per-part ids (control/label) are derived from it. */
  id?: string
  /** Controlled checked state; every toggle intent is reported through `onCheckedChange`. */
  checked?: boolean
  /** Initial checked state for the uncontrolled switch. @default false */
  defaultChecked?: boolean
  /** Blocks toggling; the checked state is kept and stays consumer-settable.
   * @default false */
  disabled?: boolean
}
