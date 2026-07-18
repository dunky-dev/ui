// Public + machine-facing types for the framework-agnostic collapsible primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type CollapsibleStateName = 'closed' | 'open'

/**
 * The cross-part ids, derived from the one `id` on context: the content
 * renders it as `id`, the trigger references it as `aria-controls`, and the
 * connect wires both sides.
 */
export interface CollapsibleIds {
  content: string
}

export interface CollapsibleContext {
  disabled: boolean
  // The base id (substrate-minted, SSR-safe); the connect derives the content
  // id from it.
  id: string
}

// `toggle` is the user's intent (gated by disabled); `open`/`close` are the
// consumer's (never gated). `disabled.set` keeps the gate fresh when the
// option flips at runtime.
export type CollapsibleMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'disabled.set'; disabled: boolean }

export interface CollapsibleCallbacks {
  /** Fired on every open/close transition with the new value. */
  onOpenChange?: (open: boolean) => void
}

/**
 * The agnostic collapsible options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface CollapsibleOptions extends CollapsibleCallbacks {
  /** Base id for the collapsible's parts; the substrate supplies a unique,
   * SSR-safe one. The content id is derived from it. */
  id?: string
  /** Controlled open state — follow + report (see SPEC.md): the machine follows
   * the value when it changes, and user toggles between updates still move
   * state, reported through `onOpenChange`. */
  open?: boolean
  /** Initial open state for the uncontrolled collapsible. @default false */
  defaultOpen?: boolean
  /** Blocks user toggling; parts carry `data-disabled`. @default false */
  disabled?: boolean
}
