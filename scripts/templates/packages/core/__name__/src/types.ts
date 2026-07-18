// Public + machine-facing types for the framework-agnostic __name__ primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

// TODO(spec): the skeleton models a single `idle` state with a `disabled` flag —
// enough to compile, test, and drive end-to-end. Describe the intended behavior
// in SPEC.md first, then grow the states/events/context to match it.

export type __Name__StateName = 'idle'

export interface __Name__Callbacks {
  /** Fired when the primitive becomes disabled. */
  disable?: () => void
}

/**
 * The agnostic __name__ options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface __Name__Options extends __Name__Callbacks {
  /** Whether the primitive is disabled. @default false */
  disabled?: boolean
}

/**
 * Machine context. Config flags (`disabled`) are seeded from options at build
 * time — the machine never sees props/callbacks; live callbacks flow through
 * the connector's reactions. See SPEC.md.
 */
export interface __Name__Context {
  disabled: boolean
}

export type __Name__MachineEvent = { type: 'SET_DISABLED'; disabled: boolean }
