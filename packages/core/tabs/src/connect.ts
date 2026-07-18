import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  AttrBindings,
  EventBindings,
  KeyboardPayload,
} from '@dunky.dev/state-machine-bindings'
import type {
  TabsContext,
  TabsIds,
  TabsMachineEvent,
  TabsOptions,
  TabsOrientation,
  TabsStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` / `data-orientation` are the
// styling/animation hooks.
export type TabsPartBindings = EventBindings &
  AttrBindings & {
    'data-state'?: 'active' | 'inactive'
    'data-orientation'?: TabsOrientation
  } & Record<string, unknown>

// The cross-part ids all derive from the one base id plus the tab's value, so
// the trigger's aria-controls and the panel's aria-labelledby always agree.
function tabsIds(id: string): TabsIds {
  return {
    trigger: value => `${id}-trigger-${value}`,
    content: value => `${id}-content-${value}`,
  }
}

/** What a substrate passes when asking for a trigger's bindings. */
export interface TabsTriggerBindingOptions {
  value: string
  disabled?: boolean
}

/** What a substrate passes when asking for a panel's bindings. */
export interface TabsContentBindingOptions {
  value: string
}

/** The view-facing surface a driver reads from the running tabs machine. */
export interface TabsApi {
  value: string | undefined
  focusedValue: string | undefined
  /** True while a tab holds keyboard focus — the substrate's gate for moving
   * real focus to the machine-designated tab. */
  focused: boolean
  orientation: TabsOrientation
  ids: TabsIds
  setValue: (value: string) => void
  parts: {
    list: TabsPartBindings
    trigger: (options: TabsTriggerBindingOptions) => TabsPartBindings
    content: (options: TabsContentBindingOptions) => TabsPartBindings
  }
}

export const tabsConnect: Connect<
  TabsStateName,
  TabsContext,
  TabsMachineEvent,
  TabsOptions,
  TabsApi
> = ({ state, context, send }) => {
  const focused = state === 'focused'
  const orientation = context.orientation
  const horizontal = orientation === 'horizontal'
  const ids = tabsIds(context.id)

  // The roving tab stop: the selected tab when it is registered and enabled,
  // otherwise the first enabled tab so the strip stays reachable (a disabled
  // tab can be selected via programmatic authority, but can't hold the stop —
  // it isn't focusable).
  let tabStopValue: string | undefined
  for (const tab of context.tabs) {
    if (tab.value === context.selectedValue && !tab.disabled) {
      tabStopValue = tab.value
      break
    }
  }
  if (tabStopValue === undefined) {
    for (const tab of context.tabs) {
      if (!tab.disabled) {
        tabStopValue = tab.value
        break
      }
    }
  }

  const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown'
  const previousKey = horizontal ? 'ArrowLeft' : 'ArrowUp'
  const onKeyDown = (event?: KeyboardPayload): void => {
    // The machine ignores navigation while idle — don't consume keys it won't
    // act on (e.g. from a non-trigger focusable a consumer put in the strip).
    if (!focused) return
    const key = event?.key
    if (key === nextKey) send({ type: 'navigate.next' })
    else if (key === previousKey) send({ type: 'navigate.previous' })
    else if (key === 'Home') send({ type: 'navigate.first' })
    else if (key === 'End') send({ type: 'navigate.last' })
    else if ((key === 'Enter' || key === ' ') && context.focusedValue !== undefined) {
      send({ type: 'select', value: context.focusedValue })
    } else return
    // The strip owns these keys: stop the page from scrolling (arrows, Home/
    // End, Space) and the native button activation from double-firing.
    event?.preventDefault?.()
  }

  return {
    value: context.selectedValue,
    focusedValue: context.focusedValue,
    focused,
    orientation,
    ids,
    setValue(next) {
      if (context.selectedValue === next) return
      send({ type: 'value.set', value: next })
    },
    parts: {
      list: {
        role: 'tablist',
        orientation,
        'data-orientation': orientation,
        onKeyDown,
        onBlur: () => send({ type: 'blur' }),
      },
      trigger({ value, disabled = false }) {
        const selected = context.selectedValue === value
        return {
          role: 'tab',
          id: ids.trigger(value),
          controls: ids.content(value),
          selected,
          disabled: disabled || undefined,
          focusable: value === tabStopValue,
          'data-state': selected ? 'active' : 'inactive',
          'data-orientation': orientation,
          onFocus: () => send({ type: 'focus', value }),
          onPress: () => send({ type: 'select', value }),
        }
      },
      content({ value }) {
        const selected = context.selectedValue === value
        return {
          role: 'tabpanel',
          id: ids.content(value),
          labelledBy: ids.trigger(value),
          // In the tab order so keyboard users step from the strip into the
          // panel's content.
          focusable: true,
          hidden: selected ? undefined : true,
          'data-state': selected ? 'active' : 'inactive',
          'data-orientation': orientation,
        }
      },
    },
  }
}

const reaction = makeReaction<TabsStateName, TabsContext, TabsMachineEvent, TabsOptions>()

// One reaction per consumer callback. Reactions fire in registration order —
// that order is the callback-order contract. See SPEC.md.
tabsConnect.reactions = [
  reaction(
    m => m.context.selectedValue,
    (value, props) => {
      if (value !== undefined) props.onValueChange?.(value)
    },
  ),
]
