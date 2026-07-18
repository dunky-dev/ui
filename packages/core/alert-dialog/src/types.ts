// Public + machine-facing types for the framework-agnostic alert-dialog
// primitive. The state machine is substrate-free: all event reading lives in a
// per-substrate driver.
import type { KeyboardPayload } from '@dunky.dev/state-machine-bindings'

export type AlertDialogStateName = 'closed' | 'open'

/** The parts whose presence drives the ARIA relationships on Content. */
export type AlertDialogPart = 'title' | 'description'

/**
 * The cross-part ids, derived from the one `id` on context. Content/title/
 * description wire the ARIA name and description; `cancel` is the one
 * non-ARIA member — how a substrate finds the least destructive action for
 * initial focus without holding a ref.
 */
export interface AlertDialogIds {
  content: string
  title: string
  description: string
  cancel: string
}

export interface AlertDialogContext {
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
  parts: Record<AlertDialogPart, boolean>
}

// Escape is a distinct dismissal intent (not a plain `close`) so a substrate
// runs the consumer veto before sending; there is no outside-interaction
// event at all — an outside press must never cause a transition.
// `controlled.sync` is the controlled driver: the substrate sends it when the
// `open` prop changes, and it is the only event that moves a controlled
// machine.
export type AlertDialogMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'escape' }
  | { type: 'controlled.sync'; open: boolean }
  | { type: 'part.presence'; part: AlertDialogPart; present: boolean }

export interface AlertDialogCallbacks {
  /** Fired on every open/close intent with the new value. A controlled alert
   * dialog reports without moving — it follows the `open` prop alone. */
  onOpenChange?: (open: boolean) => void
  /** Fired before an Escape dismissal; `preventDefault()` vetoes it. */
  onEscapeKeyDown?: (event: KeyboardPayload) => void
}

/**
 * The agnostic alert-dialog options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 * Deliberately lean: modality, the alertdialog role, and the outside-press
 * immunity are the pattern, not options (see SPEC.md).
 */
export interface AlertDialogOptions extends AlertDialogCallbacks {
  /** Base id for the alert dialog's parts; the substrate supplies a unique,
   * SSR-safe one. The per-part ids (content/title/description/cancel) are
   * derived from it. */
  id?: string
  /** Controlled open state; every open/close intent is reported through
   * `onOpenChange`, and the alert dialog moves only when this prop does. */
  open?: boolean
  /** Initial open state for the uncontrolled alert dialog. @default false */
  defaultOpen?: boolean
}
