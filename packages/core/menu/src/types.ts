// Public + machine-facing types for the framework-agnostic menu primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.
import type { KeyboardPayload, PointerPayload } from '@dunky.dev/state-machine-bindings'

export type MenuStateName = 'closed' | 'open'

/** Where a keyboard open aims the highlight before any item registers. */
export type MenuHighlightAim = 'first' | 'last'

/** A highlight move over the registered, enabled items. */
export type MenuHighlightMove = 'first' | 'last' | 'next' | 'previous'

/** The parts whose presence drives cross-part ARIA references. */
export type MenuPart = 'trigger'

/** One registered item — the data navigation, typeahead, and activation
 * operate on. Substrates report it as items mount and unmount. */
export interface MenuItem {
  /** Unique, id-safe identity of the item within the menu. */
  value: string
  /** The typeahead label. */
  label: string
  disabled: boolean
}

/** The selection mailbox token: a fresh object per activation, so the same
 * item selected twice still reads as a change. */
export interface MenuSelection {
  value: string
}

/**
 * The cross-part ids, derived from the one `id` on context: each renders as
 * `id` on one element and as an ARIA reference (aria-controls / labelledby /
 * activedescendant) on another, and the connect wires both sides.
 */
export interface MenuIds {
  trigger: string
  content: string
}

export interface MenuContext {
  // The base id (substrate-minted, SSR-safe); the connect derives the per-part
  // ids from it.
  id: string
  // Whether the consumer controls `open`. Fixed at build time: a controlled
  // machine never moves on its own — intents go out through `openIntent` and
  // only `controlled.sync` (the prop echo) transitions it.
  controlled: boolean
  // Emission mailbox for onOpenChange: a fresh token per intent so the
  // reaction fires even when the intended value repeats.
  openIntent: { open: boolean } | null
  /** Registered items, in mount order — document order at mount time. An item
   * mounted mid-list while the menu is open registers at the end (see SPEC). */
  items: MenuItem[]
  /** The single highlight; only an enabled, registered item can hold it. */
  highlightedValue: string | null
  /** A keyboard open's aim, held until items register to resolve it. */
  pendingHighlight: MenuHighlightAim | null
  typeaheadQuery: string
  /** Timestamp of the last typeahead character, for the reset pause. */
  typeaheadAt: number
  /** The selection mailbox the substrate delivers to the item's callback. */
  selection: MenuSelection | null
  // Which optional parts are currently present, so Content only references the
  // ones actually rendered.
  parts: Record<MenuPart, boolean>
  /** Group ids whose label is currently rendered. */
  groupLabels: Record<string, boolean>
}

// Dismissal intents (`escape` / `tab` / `interact.outside`) are distinct from
// `close` so each stays attributable to its cause. `controlled.sync` is the
// controlled driver: the substrate sends it when the `open` prop changes, and
// it is the only event that moves a controlled machine.
export type MenuMachineEvent =
  | { type: 'open'; highlight?: MenuHighlightAim }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'escape' }
  | { type: 'tab' }
  | { type: 'interact.outside' }
  | { type: 'controlled.sync'; open: boolean }
  | { type: 'item.register'; item: MenuItem }
  | { type: 'item.unregister'; value: string }
  | { type: 'item.activate'; value?: string }
  | { type: 'highlight.set'; value: string | null }
  | { type: 'highlight.move'; to: MenuHighlightMove }
  | { type: 'typeahead'; key: string }
  | { type: 'part.presence'; part: MenuPart; present: boolean }
  | { type: 'group.label.presence'; group: string; present: boolean }

export interface MenuCallbacks {
  /** Fired with every open/close intent. Uncontrolled, the menu also moves;
   * controlled, it moves only when the `open` prop follows. */
  onOpenChange?: (open: boolean) => void
  /** Fired before an Escape dismissal; `preventDefault()` vetoes it. */
  onEscapeKeyDown?: (event: KeyboardPayload) => void
  /** Fired before an outside-interaction dismissal; `preventDefault()` vetoes it. */
  onInteractOutside?: (event?: PointerPayload) => void
}

/**
 * The agnostic menu options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface MenuOptions extends MenuCallbacks {
  /** Base id for the menu's parts; the substrate supplies a unique, SSR-safe
   * one. The per-part ids (trigger/content/items) are derived from it. */
  id?: string
  /** Controlled open state; every open/close intent is reported through `onOpenChange`. */
  open?: boolean
  /** Initial open state for the uncontrolled menu. @default false */
  defaultOpen?: boolean
}
