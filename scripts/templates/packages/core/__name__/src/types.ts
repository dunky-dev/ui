// Public + machine-facing types for the framework-agnostic __name__ primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export interface __Name__Callbacks {
  /** Fired when the primitive activates. */
  onActivate?: () => void
}

export interface __Name__Options extends __Name__Callbacks {
  /** No events fire while disabled; an in-flight interaction is cancelled. */
  disabled?: boolean
}

export type __Name__StateName = 'idle'

/**
 * Machine context. Config flags (`disabled`) are seeded from options at build
 * time — the machine itself never sees props/callbacks. `activateEvent` is an
 * emission mailbox: writing a NEW value into it fires the matching connector
 * reaction, which is how the consumer callback is dispatched. See SPEC.md.
 */
export interface __Name__Context {
  disabled: boolean
  /** Emission mailbox: a fresh token fires onActivate; an unchanged one suppresses it. */
  activateEvent: object | null
}

export type __Name__MachineEvent =
  | { type: 'ACTIVATE' }
  | { type: 'SET_DISABLED'; disabled: boolean }
