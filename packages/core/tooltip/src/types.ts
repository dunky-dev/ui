// Public + machine-facing types for the framework-agnostic tooltip primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type TooltipStateName = 'closed' | 'opening' | 'open' | 'closing'

/**
 * The cross-part ids, derived from the one `id` on context: the content id
 * renders as `id` on the content and as `aria-describedby` on the trigger,
 * and the connect wires both sides.
 */
export interface TooltipIds {
  content: string
}

export interface TooltipContext {
  openDelay: number
  closeDelay: number
  // The base id (substrate-minted, SSR-safe); the connect derives the content
  // id from it.
  id: string
  // Armed by a trigger press so the focus that press causes doesn't reopen
  // the tooltip; consumed by the next focus, disarmed by press or blur.
  // See SPEC.md.
  focusOpenSuppressed: boolean
}

// Hover events carry intent through the delay states; `focus`/`blur`/`escape`/
// `pointer.down`/`press` are the immediate paths (`press` is the activation —
// click — that ends a pointer press or a keyboard Enter/Space); `open`/`close`
// are the imperative (controlled) intents. The delay-elapsed transitions are
// timed (`after`), not events — the machine owns its timers.
export type TooltipMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'pointer.enter' }
  | { type: 'pointer.leave' }
  | { type: 'pointer.down' }
  | { type: 'press' }
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'escape' }

export interface TooltipCallbacks {
  /** Fired on every show/hide with the new value — `open` and `closing` both
   * count as shown. */
  onOpenChange?: (open: boolean) => void
}

/**
 * The agnostic tooltip options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface TooltipOptions extends TooltipCallbacks {
  /** Base id for the tooltip's parts; the substrate supplies a unique,
   * SSR-safe one. The content id is derived from it. */
  id?: string
  /** Controlled open state; every show/hide intent is reported through `onOpenChange`. */
  open?: boolean
  /** Initial open state for the uncontrolled tooltip. @default false */
  defaultOpen?: boolean
  /** Milliseconds the pointer must rest on the trigger before showing. @default 700 */
  openDelay?: number
  /** Milliseconds the tooltip lingers after the pointer leaves. @default 300 */
  closeDelay?: number
}
