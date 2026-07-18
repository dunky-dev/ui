// Public + machine-facing types for the framework-agnostic popover primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.
import type { KeyboardPayload, PointerPayload } from '@dunky.dev/state-machine-bindings'

export type PopoverStateName = 'closed' | 'open'

/** The parts whose presence drives the ARIA relationships on Content. */
export type PopoverPart = 'title' | 'description'

/**
 * The cross-part ids, derived from the one `id` on context: each renders as
 * `id` on one element and as an ARIA reference (aria-controls / labelledby /
 * describedby) on another, and the connect wires both sides.
 */
export interface PopoverIds {
  content: string
  title: string
  description: string
}

export interface PopoverContext {
  modal: boolean
  closeOnEscape: boolean
  closeOnInteractOutside: boolean
  // Whether the consumer controls `open`. Fixed at build time: a controlled
  // machine never moves on its own — intents go out through `openIntent` and
  // only `controlled.sync` (the prop echo) transitions it.
  controlled: boolean
  // Emission mailbox for onOpenChange: a fresh token per intent so the
  // reaction fires even when the intended value repeats.
  openIntent: { open: boolean } | null
  // The base id (substrate-minted, SSR-safe); the connect derives the per-part
  // ids from it.
  id: string
  // Which optional parts are currently present, so Content only references the
  // ones actually rendered.
  parts: Record<PopoverPart, boolean>
}

// Dismissal intents (`escape` / `interact.outside`) are distinct from `close`
// so the machine can gate them. `controlled.sync` is the controlled driver:
// the substrate sends it when the `open` prop changes, and it is the only
// event that moves a controlled machine.
export type PopoverMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'escape' }
  | { type: 'interact.outside' }
  | { type: 'controlled.sync'; open: boolean }
  | { type: 'part.presence'; part: PopoverPart; present: boolean }

export interface PopoverCallbacks {
  /** Fired on every open/close transition with the new value. */
  onOpenChange?: (open: boolean) => void
  /** Fired before an Escape dismissal; `preventDefault()` vetoes it. */
  onEscapeKeyDown?: (event: KeyboardPayload) => void
  /** Fired before an outside-interaction dismissal; `preventDefault()` vetoes it. */
  onInteractOutside?: (event?: PointerPayload) => void
}

/**
 * The agnostic popover options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface PopoverOptions extends PopoverCallbacks {
  /** Base id for the popover's parts; the substrate supplies a unique, SSR-safe
   * one. The per-part ids (content/title/description) are derived from it. */
  id?: string
  /** Controlled open state; every open/close intent is reported through `onOpenChange`. */
  open?: boolean
  /** Initial open state for the uncontrolled popover. @default false */
  defaultOpen?: boolean
  /** Marks the popover modal: `aria-modal`, focus trap, and hiding the outside
   * from assistive tech. @default false */
  modal?: boolean
  /** Whether Escape closes the popover. @default true */
  closeOnEscape?: boolean
  /** Whether an interaction outside the panel closes the popover. @default true */
  closeOnInteractOutside?: boolean
}
