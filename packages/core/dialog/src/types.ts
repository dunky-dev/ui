// Public + machine-facing types for the framework-agnostic dialog primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type DialogStateName = 'closed' | 'open'

export type DialogRole = 'dialog' | 'alertdialog'

/** The parts whose presence drives the ARIA relationships on Content. */
export type DialogPart = 'title' | 'description'

/**
 * Ids that cross parts: each renders as `id` on one element and as an ARIA
 * reference (aria-controls / labelledby / describedby) on another, so the
 * substrate mints them once (SSR-safe) and the connect wires both sides.
 */
export interface DialogIds {
  content: string
  title: string
  description: string
}

/**
 * The vetoable payload a dismissal callback receives — the DOM event in a
 * browser substrate, or any object honoring the preventDefault contract.
 */
export interface DismissPayload {
  defaultPrevented: boolean
  preventDefault: () => void
}

export interface DialogContext {
  role: DialogRole
  modal: boolean
  closeOnEscape: boolean
  closeOnInteractOutside: boolean
  ids: DialogIds
  // Which optional parts are currently present, so Content only references the
  // ones actually rendered.
  parts: Record<DialogPart, boolean>
}

// Dismissal intents (`escape` / `interact.outside`) are distinct from `close`
// so the machine can gate them.
export type DialogMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'escape' }
  | { type: 'interact.outside' }
  | { type: 'part.presence'; part: DialogPart; present: boolean }

export interface DialogCallbacks {
  /** Fired on every open/close transition with the new value. */
  onOpenChange?: (open: boolean) => void
  /** Fired before an Escape dismissal; `preventDefault()` vetoes it. */
  onEscapeKeyDown?: (event: DismissPayload) => void
  /** Fired before an outside-press dismissal; `preventDefault()` vetoes it. */
  onInteractOutside?: (event?: DismissPayload) => void
}

/**
 * The agnostic dialog options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface DialogOptions extends DialogCallbacks {
  /** Controlled open state; every open/close intent is reported through `onOpenChange`. */
  open?: boolean
  /** Initial open state for the uncontrolled dialog. @default false */
  defaultOpen?: boolean
  /** Marks the dialog modal: `aria-modal`, focus trap, scroll lock. @default true */
  modal?: boolean
  /** The ARIA pattern: a plain dialog or an alert dialog for urgent
   * interruptions. @default 'dialog' */
  role?: DialogRole
  /** Whether Escape closes the dialog. @default true */
  closeOnEscape?: boolean
  /** Whether pressing the backdrop closes the dialog.
   * @default true — false when `role="alertdialog"` */
  closeOnInteractOutside?: boolean
}
