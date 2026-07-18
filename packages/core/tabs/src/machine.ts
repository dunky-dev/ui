import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type { TabsContext, TabsMachineEvent, TabsOptions, TabsStateName, TabsTab } from './types'

/** The running tabs machine — what a substrate holds and sends events to. */
export type TabsMachine = Machine<TabsStateName, TabsContext, TabsMachineEvent>

type TabsAction = Action<TabsContext, TabsMachineEvent>
type TabsGuard = Guard<TabsContext, TabsMachineEvent>

function findTabIndex(tabs: TabsTab[], value: string | undefined): number {
  if (value === undefined) return -1
  for (let index = 0; index < tabs.length; index++) {
    if (tabs[index].value === value) return index
  }
  return -1
}

// Walk the registry from `from` in `step` direction, wrapping, until an
// enabled tab turns up — the "skip disabled" rule in one place.
function findEnabledTab(tabs: TabsTab[], from: number, step: 1 | -1): TabsTab | undefined {
  const count = tabs.length
  for (let offset = 1; offset <= count; offset++) {
    const tab = tabs[(((from + step * offset) % count) + count) % count]
    if (!tab.disabled) return tab
  }
  return undefined
}

const canSelect: TabsGuard = ({ context, event }) => {
  if (event.type !== 'select') return false
  const index = findTabIndex(context.tabs, event.value)
  return index !== -1 && !context.tabs[index].disabled
}

const setSelected: TabsAction = ({ event, setContext }) => {
  if (event.type !== 'select' && event.type !== 'value.set') return
  setContext({ selectedValue: event.value })
}

// Registration is an upsert: a known value updates its disabled flag in place
// so the tab keeps its navigation slot; a new value appends in DOM order.
const registerTab: TabsAction = ({ event, context, setContext }) => {
  if (event.type !== 'tab.register') return
  const tabs = context.tabs
  const index = findTabIndex(tabs, event.value)
  if (index === -1) {
    setContext({ tabs: [...tabs, { value: event.value, disabled: event.disabled }] })
    return
  }
  if (tabs[index].disabled === event.disabled) return
  const next = tabs.slice()
  next[index] = { value: event.value, disabled: event.disabled }
  setContext({ tabs: next })
}

const unregisterTab: TabsAction = ({ event, context, setContext }) => {
  if (event.type !== 'tab.unregister') return
  const index = findTabIndex(context.tabs, event.value)
  if (index === -1) return
  const next = context.tabs.slice()
  next.splice(index, 1)
  setContext({ tabs: next })
}

// Focus lands on a tab: record it, and let automatic activation select it —
// unless the tab is disabled (focus is possible, activation never is).
const setFocusedTab: TabsAction = ({ event, context, setContext }) => {
  if (event.type !== 'focus') return
  const patch: Partial<TabsContext> = { focusedValue: event.value }
  const index = findTabIndex(context.tabs, event.value)
  if (context.activationMode === 'automatic' && index !== -1 && !context.tabs[index].disabled) {
    patch.selectedValue = event.value
  }
  setContext(patch)
}

const clearFocusedTab: TabsAction = ({ setContext }) => {
  setContext({ focusedValue: undefined })
}

function moveFocusTo(
  context: TabsContext,
  setContext: (patch: Partial<TabsContext>) => void,
  tab: TabsTab | undefined,
): void {
  if (tab === undefined) return
  const patch: Partial<TabsContext> = { focusedValue: tab.value }
  if (context.activationMode === 'automatic') patch.selectedValue = tab.value
  setContext(patch)
}

// Relative moves anchor on the focused tab (falling back to the selected
// one); an unknown anchor resolves to the first/last enabled tab.
const focusNext: TabsAction = ({ context, setContext }) => {
  const anchor = findTabIndex(context.tabs, context.focusedValue ?? context.selectedValue)
  moveFocusTo(context, setContext, findEnabledTab(context.tabs, anchor, 1))
}

const focusPrevious: TabsAction = ({ context, setContext }) => {
  const anchor = findTabIndex(context.tabs, context.focusedValue ?? context.selectedValue)
  moveFocusTo(context, setContext, findEnabledTab(context.tabs, anchor === -1 ? 0 : anchor, -1))
}

const focusFirst: TabsAction = ({ context, setContext }) => {
  moveFocusTo(context, setContext, findEnabledTab(context.tabs, -1, 1))
}

const focusLast: TabsAction = ({ context, setContext }) => {
  moveFocusTo(context, setContext, findEnabledTab(context.tabs, 0, -1))
}

export function tabsMachine(
  options: TabsOptions,
): TransitionConfig<TabsStateName, TabsContext, TabsMachineEvent> {
  // Annotated so createMachine infers Context as TabsContext, not the narrowed literal.
  const context: TabsContext = {
    orientation: options.orientation ?? 'horizontal',
    activationMode: options.activationMode ?? 'automatic',
    // The substrate supplies a unique id; `tabs` is only a bare fallback.
    id: options.id ?? 'tabs',
    selectedValue: options.value ?? options.defaultValue,
    focusedValue: undefined,
    tabs: [],
  }

  return setup.as<TabsContext, TabsMachineEvent>().createMachine({
    initial: 'idle',
    context,
    // Top-level: registration and selection work from any state; focus always
    // lands in `focused`.
    on: {
      'tab.register': { actions: registerTab },
      'tab.unregister': { actions: unregisterTab },
      select: { guard: canSelect, actions: setSelected },
      'value.set': { actions: setSelected },
      focus: { target: 'focused', actions: setFocusedTab },
    },
    states: {
      idle: {},
      focused: {
        on: {
          blur: { target: 'idle', actions: clearFocusedTab },
          'navigate.next': { actions: focusNext },
          'navigate.previous': { actions: focusPrevious },
          'navigate.first': { actions: focusFirst },
          'navigate.last': { actions: focusLast },
        },
      },
    },
  })
}
