// Public + machine-facing types for the framework-agnostic dialog primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.
import type { Controllable, ControlledSync } from '@dunky.dev/controllable'
import type { KeyboardPayload, PointerPayload } from '@dunky.dev/state-machine-bindings'

export type DialogStateName = 'closed' | 'open'

export type DialogRole = 'dialog' | 'alertdialog'

/** The parts whose presence drives the ARIA relationships on Content. */
export type DialogPart = 'title' | 'description'

/**
 * The cross-part ids, derived from the one `id` on context: each renders as
 * `id` on one element and as an ARIA reference (aria-controls / labelledby /
 * describedby) on another, and the connect wires both sides.
 */
export interface DialogIds {
  content: string
  title: string
  description: string
}

export interface DialogContext {
  role: DialogRole
  modal: boolean
  closeOnEscape: boolean
  closeOnInteractOutside: boolean
  // The consumer-ownable open value. A controlled machine never moves on its
  // own — only `controlled.sync` (the prop echo) transitions it, and the
  // controlled flag tracks the prop's presence live.
  open: Controllable<boolean>
  // The base id (substrate-minted, SSR-safe); the connect derives the per-part
  // ids from it.
  id: string
  // Which optional parts are currently present, so Content only references the
  // ones actually rendered.
  parts: Record<DialogPart, boolean>
}

// Dismissal intents (`escape` / `interact.outside`) are distinct from `close`
// so the machine can gate them. `controlled.sync` is the controlled driver:
// the substrate sends it when the `open` prop changes, and it is the only
// event that moves a controlled machine.
export type DialogMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'escape' }
  | { type: 'interact.outside' }
  | ControlledSync<boolean>
  | { type: 'part.presence'; part: DialogPart; present: boolean }

export interface DialogCallbacks {
  /** Fired on every open/close transition with the new value. */
  onOpenChange?: (open: boolean) => void
  /** Fired before an Escape dismissal; `preventDefault()` vetoes it. */
  onEscapeKeyDown?: (event: KeyboardPayload) => void
  /** Fired before an outside-press dismissal; `preventDefault()` vetoes it. */
  onInteractOutside?: (event?: PointerPayload) => void
}

/**
 * The agnostic dialog options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface DialogOptions extends DialogCallbacks {
  /** Base id for the dialog's parts; the substrate supplies a unique, SSR-safe
   * one. The per-part ids (content/title/description) are derived from it. */
  id?: string
  /** Controlled open state: the dialog follows this prop alone and never
   * moves on its own. Set back to `undefined` to hand the state over —
   * uncontrolled from there, right where it stands. */
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
