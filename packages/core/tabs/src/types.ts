// Public + machine-facing types for the framework-agnostic tabs primitive.
// The state machine is substrate-free: all event reading lives in a
// per-substrate driver.

export type TabsStateName = 'idle' | 'focused'

export type TabsOrientation = 'horizontal' | 'vertical'

/**
 * When keyboard focus selects: `automatic` selects the tab that receives
 * focus (arrow keys select as they move); `manual` moves focus only —
 * Enter/Space select the focused tab.
 */
export type TabsActivationMode = 'automatic' | 'manual'

/**
 * The cross-part ids, derived from the one `id` on context plus a tab value:
 * each renders as `id` on one element and as an ARIA reference
 * (aria-controls / aria-labelledby) on its counterpart, and the connect wires
 * both sides.
 */
export interface TabsIds {
  trigger: (value: string) => string
  content: (value: string) => string
}

/** A registered tab: one entry per trigger, in DOM (= navigation) order. */
export interface TabsTab {
  value: string
  disabled: boolean
}

export interface TabsContext {
  orientation: TabsOrientation
  activationMode: TabsActivationMode
  // The base id (substrate-minted, SSR-safe); the connect derives the per-tab
  // trigger/panel ids from it plus the tab's value.
  id: string
  /** The selected tab — drives which panel shows and the roving tab stop. */
  selectedValue: string | undefined
  /** The tab holding keyboard focus; defined only while the strip is focused. */
  focusedValue: string | undefined
  /** The registered tabs, in registration order — the navigation order. */
  tabs: TabsTab[]
}

// `select` is guarded user intent (a disabled or unregistered tab never
// selects); `value.set` is programmatic authority (setValue, the controlled
// value) and always lands.
export type TabsMachineEvent =
  | { type: 'tab.register'; value: string; disabled: boolean }
  | { type: 'tab.unregister'; value: string }
  | { type: 'select'; value: string }
  | { type: 'value.set'; value: string }
  | { type: 'focus'; value: string }
  | { type: 'blur' }
  | { type: 'navigate.next' }
  | { type: 'navigate.previous' }
  | { type: 'navigate.first' }
  | { type: 'navigate.last' }

export interface TabsCallbacks {
  /** Fired on every selection change with the newly selected value. */
  onValueChange?: (value: string) => void
}

/**
 * The agnostic tabs options — the behavior a consumer configures. A
 * substrate's props extend this with its own concerns (e.g. `children`).
 */
export interface TabsOptions extends TabsCallbacks {
  /** Base id for the tabs' parts; the substrate supplies a unique, SSR-safe
   * one. The per-tab trigger/panel ids are derived from it plus the value. */
  id?: string
  /** Controlled selected value; every selection change is reported through
   * `onValueChange`. */
  value?: string
  /** Initial selected value for the uncontrolled tabs. */
  defaultValue?: string
  /** The strip's axis: picks the arrow-key pair and renders as
   * `aria-orientation`. @default 'horizontal' */
  orientation?: TabsOrientation
  /** How keyboard focus selects. @default 'automatic' */
  activationMode?: TabsActivationMode
}
