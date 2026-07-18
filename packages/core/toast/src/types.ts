// Public + machine-facing types for the framework-agnostic toast primitive.
// The state machine is substrate-free: all event reading and timer scheduling
// live in a per-substrate driver.

export type ToastStateName = 'closed' | 'open' | 'paused'

/**
 * How assertively the toast is announced: `foreground` (the direct result of
 * a user action) maps to `aria-live="assertive"`, `background` (a task the
 * user didn't just perform) to `aria-live="polite"`.
 */
export type ToastType = 'foreground' | 'background'

/** The parts whose presence drives the ARIA relationships on Root. */
export type ToastPart = 'title' | 'description'

/**
 * The cross-part ids, derived from the one `id` on context: title/description
 * render as `id` on their element and as an ARIA reference (labelledby /
 * describedby) on Root, and the connect wires both sides.
 */
export interface ToastIds {
  root: string
  title: string
  description: string
}

export interface ToastContext {
  type: ToastType
  // Auto-dismiss duration in ms; a non-finite value means persistent. The
  // substrate's timer effect reads it when scheduling.
  duration: number
  // The base id (substrate-minted, SSR-safe); the connect derives the per-part
  // ids from it.
  id: string
  // Which optional parts are currently present, so Root only references the
  // ones actually rendered.
  parts: Record<ToastPart, boolean>
}

// The timer events are distinct from `close` so the state graph — not the
// substrate's scheduler — stays the authority: only `open` accepts an elapse.
export type ToastMachineEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'timer.elapsed' }
  | { type: 'timer.pause' }
  | { type: 'timer.resume' }
  | { type: 'part.presence'; part: ToastPart; present: boolean }

export interface ToastCallbacks {
  /** Fired on every open/close transition — including auto-dismiss — with the
   * new value. Pause/resume is never reported. */
  onOpenChange?: (open: boolean) => void
}

/**
 * The agnostic toast options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface ToastOptions extends ToastCallbacks {
  /** Base id for the toast's parts; the substrate supplies a unique, SSR-safe
   * one. The per-part ids (root/title/description) are derived from it. */
  id?: string
  /** Controlled open state; every open/close intent is reported through `onOpenChange`. */
  open?: boolean
  /** Initial open state for the uncontrolled toast — rendering a toast is the
   * intent to show it. @default true */
  defaultOpen?: boolean
  /** Announcement politeness. @default 'foreground' */
  type?: ToastType
  /** Auto-dismiss duration in ms; `Infinity` makes the toast persistent. The
   * substrate defaults it from its provider surface. @default 5000 */
  duration?: number
}
