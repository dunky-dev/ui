import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  AttrBindings,
  EventBindings,
  KeyboardPayload,
  PointerPayload,
} from '@dunky.dev/state-machine-bindings'
import type {
  MenuContext,
  MenuHighlightAim,
  MenuIds,
  MenuMachineEvent,
  MenuOptions,
  MenuStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook.
export type MenuPartBindings = EventBindings &
  AttrBindings & { 'data-state'?: MenuStateName } & Record<string, unknown>

// The cross-part ids all derive from the one base id, so the trigger's
// aria-controls, Content's id/labelledby, and activedescendant always agree.
function menuIds(id: string): MenuIds {
  return { trigger: `${id}-trigger`, content: `${id}-content` }
}

// Item ids derive from the item's value — unique and id-safe by contract.
function menuItemId(id: string, value: string): string {
  return `${id}-item-${value}`
}

/** The per-item facts a substrate hands over when asking for item bindings. */
export interface MenuItemBindingsProps {
  value: string
  disabled?: boolean
}

/** The per-group identity (substrate-minted) for group/label bindings. */
export interface MenuGroupBindingsProps {
  id: string
}

/** The view-facing surface a driver reads from the running menu machine. */
export interface MenuApi {
  open: boolean
  highlightedValue: string | null
  ids: MenuIds
  setOpen: (open: boolean) => void
  /** Routes a detected outside interaction as a veto-able dismissal intent. */
  interactOutside: (event?: PointerPayload) => void
  parts: {
    trigger: MenuPartBindings
    content: MenuPartBindings
    separator: MenuPartBindings
  }
  // Items and groups are many per menu, so their bindings are derived from the
  // instance facts rather than carried as static parts.
  getItemBindings: (props: MenuItemBindingsProps) => MenuPartBindings
  getGroupBindings: (props: MenuGroupBindingsProps) => MenuPartBindings
  getGroupLabelBindings: (props: MenuGroupBindingsProps) => MenuPartBindings
}

export const menuConnect: Connect<
  MenuStateName,
  MenuContext,
  MenuMachineEvent,
  MenuOptions,
  MenuApi
> = ({ state, context, props, send }) => {
  const open = state === 'open'
  const dataState: MenuStateName = open ? 'open' : 'closed'
  const ids = menuIds(context.id)

  // A keyboard open aims the highlight; preventDefault suppresses the key's
  // native action (synthetic click, page scroll) so the send is the only
  // effect. Already open — reachable when focus stayed on the trigger, e.g. a
  // controlled open — Enter/Space keep their native meaning and toggle-close
  // instead of being swallowed by a re-open the open state ignores.
  const onTriggerKeyDown = (event?: KeyboardPayload): void => {
    const key = event?.key
    let aim: MenuHighlightAim | undefined
    if (key === 'Enter' || key === ' ' || key === 'ArrowDown') aim = 'first'
    else if (key === 'ArrowUp') aim = 'last'
    if (aim === undefined) return
    event?.preventDefault?.()
    if (open) {
      if (key === 'Enter' || key === ' ') send({ type: 'toggle' })
      return
    }
    send({ type: 'open', highlight: aim })
  }

  // DOM focus rests on the content while open (see SPEC: Design), so every
  // menu key arrives here. Tab keeps its default action — the close lets
  // focus continue on its way.
  const onContentKeyDown = (event?: KeyboardPayload): void => {
    const key = event?.key
    if (key === undefined) return
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event?.preventDefault?.()
      send({ type: 'highlight.move', to: key === 'ArrowDown' ? 'next' : 'previous' })
    } else if (key === 'Home' || key === 'End') {
      event?.preventDefault?.()
      send({ type: 'highlight.move', to: key === 'Home' ? 'first' : 'last' })
    } else if (key === 'Enter' || key === ' ') {
      event?.preventDefault?.()
      send({ type: 'item.activate' })
    } else if (key === 'Tab') {
      send({ type: 'tab' })
    } else if (key.length === 1) {
      send({ type: 'typeahead', key })
    }
  }

  // An outside interaction is an intent, not a close command: the consumer may
  // veto it before the machine decides.
  const interactOutside = (event?: PointerPayload): void => {
    props.onInteractOutside?.(event)
    if (event?.defaultPrevented !== true) send({ type: 'interact.outside' })
  }

  return {
    open,
    highlightedValue: context.highlightedValue,
    ids,
    setOpen(next) {
      if (open === next) return
      send({ type: next ? 'open' : 'close' })
    },
    interactOutside,
    parts: {
      trigger: {
        id: ids.trigger,
        hasPopup: 'menu',
        expanded: open,
        // A dangling aria-controls id is an a11y defect — only while open.
        controls: open ? ids.content : undefined,
        'data-state': dataState,
        onPress: () => send({ type: 'toggle' }),
        onKeyDown: onTriggerKeyDown,
      },
      content: {
        role: 'menu',
        id: ids.content,
        labelledBy: context.parts.trigger ? ids.trigger : undefined,
        activeDescendant:
          context.highlightedValue === null
            ? undefined
            : menuItemId(context.id, context.highlightedValue),
        orientation: 'vertical',
        // The focus surface while open: focusable in script, not in the tab order.
        focusable: false,
        'data-state': dataState,
        onKeyDown: onContentKeyDown,
      },
      separator: {
        role: 'separator',
        orientation: 'horizontal',
      },
    },
    getItemBindings({ value, disabled = false }) {
      const highlighted = context.highlightedValue === value
      return {
        role: 'menuitem',
        id: menuItemId(context.id, value),
        disabled: disabled || undefined,
        'data-highlighted': highlighted ? '' : undefined,
        'data-disabled': disabled ? '' : undefined,
        onPress: () => send({ type: 'item.activate', value }),
        onPointerEnter: () => send({ type: 'highlight.set', value }),
        onPointerLeave: () => send({ type: 'highlight.set', value: null }),
      }
    },
    getGroupBindings({ id }) {
      return {
        role: 'group',
        // Only reference a label that is actually rendered.
        labelledBy: context.groupLabels[id] === true ? `${id}-label` : undefined,
      }
    },
    getGroupLabelBindings({ id }) {
      return { id: `${id}-label` }
    },
  }
}

const reaction = makeReaction<MenuStateName, MenuContext, MenuMachineEvent, MenuOptions>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. The per-item
// selection callback rides the mailbox instead (see SPEC: Design), delivered by
// the substrate before the close is observable.
// onOpenChange reads the intent mailbox, not the state: a controlled machine
// reports intents without moving, and the prop-driven `controlled.sync`
// transition never writes the mailbox — the consumer's own change isn't echoed.
menuConnect.reactions = [
  reaction(
    m => m.context.openIntent,
    (intent, props) => {
      if (intent !== null) props.onOpenChange?.(intent.open)
    },
  ),
]
