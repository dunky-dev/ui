import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type { AttrBindings, EventBindings, PointerPayload } from '@dunky.dev/state-machine-bindings'
import type {
  DrawerContext,
  DrawerIds,
  DrawerMachineEvent,
  DrawerOptions,
  DrawerPlacement,
  DrawerStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook;
// `data-placement` keys edge-specific styling on the visual layers.
export type DrawerPartBindings = EventBindings &
  AttrBindings & {
    'data-state'?: DrawerStateName
    'data-placement'?: DrawerPlacement
  } & Record<string, unknown>

// The cross-part ids all derive from the one base id, so the trigger's
// aria-controls, Content's id, and the labelledby/describedby always agree.
function drawerIds(id: string): DrawerIds {
  return { content: `${id}-content`, title: `${id}-title`, description: `${id}-description` }
}

/** The view-facing surface a driver reads from the running drawer machine. */
export interface DrawerApi {
  open: boolean
  placement: DrawerPlacement
  ids: DrawerIds
  setOpen: (open: boolean) => void
  parts: {
    trigger: DrawerPartBindings
    backdrop: DrawerPartBindings
    viewport: DrawerPartBindings
    content: DrawerPartBindings
    title: DrawerPartBindings
    description: DrawerPartBindings
    close: DrawerPartBindings
  }
}

export const drawerConnect: Connect<
  DrawerStateName,
  DrawerContext,
  DrawerMachineEvent,
  DrawerOptions,
  DrawerApi
> = ({ state, context, props, send }) => {
  const open = state === 'open'
  const dataState: DrawerStateName = open ? 'open' : 'closed'
  const placement = context.placement
  const ids = drawerIds(context.id)

  // An outside press is an intent, not a close command: the consumer may veto
  // it; whether it dismisses is gated in the machine.
  const onOutsidePress = (event?: PointerPayload): void => {
    props.onInteractOutside?.(event)
    if (event?.defaultPrevented !== true) send({ type: 'interact.outside' })
  }

  return {
    open,
    placement,
    ids,
    setOpen(next) {
      if (open === next) return
      send({ type: next ? 'open' : 'close' })
    },
    parts: {
      trigger: {
        hasPopup: 'dialog',
        expanded: open,
        // A dangling aria-controls id is an a11y defect — only while open.
        controls: open ? ids.content : undefined,
        'data-state': dataState,
        onPress: () => send({ type: 'toggle' }),
      },
      backdrop: {
        'data-state': dataState,
        'data-placement': placement,
        onPress: onOutsidePress,
      },
      viewport: {
        'data-state': dataState,
        'data-placement': placement,
        onPress: onOutsidePress,
      },
      content: {
        role: 'dialog',
        id: ids.content,
        // A drawer is always modal (see SPEC.md, Design).
        modal: true,
        labelledBy: context.parts.title ? ids.title : undefined,
        describedBy: context.parts.description ? ids.description : undefined,
        // The initial focus target: focusable in script, not in the tab order.
        focusable: false,
        'data-state': dataState,
        'data-placement': placement,
      },
      title: { id: ids.title },
      description: { id: ids.description },
      close: {
        onPress: () => send({ type: 'close' }),
      },
    },
  }
}

const reaction = makeReaction<DrawerStateName, DrawerContext, DrawerMachineEvent, DrawerOptions>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
// onOpenChange reads the intent mailbox, not the state: a controlled machine
// reports intents without moving, and the prop-driven `controlled.sync`
// transition never writes the mailbox — the consumer's own change isn't echoed.
drawerConnect.reactions = [
  reaction(
    m => m.context.openIntent,
    (intent, props) => {
      if (intent !== null) props.onOpenChange?.(intent.open)
    },
  ),
]
