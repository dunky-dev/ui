import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type { AttrBindings, EventBindings, PointerPayload } from '@dunky.dev/state-machine-bindings'
import type {
  DialogContext,
  DialogIds,
  DialogMachineEvent,
  DialogOptions,
  DialogRole,
  DialogStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook.
export type DialogPartBindings = EventBindings &
  AttrBindings & { 'data-state'?: DialogStateName } & Record<string, unknown>

// The cross-part ids all derive from the one base id, so the trigger's
// aria-controls, Content's id, and the labelledby/describedby always agree.
function dialogIds(id: string): DialogIds {
  return { content: `${id}-content`, title: `${id}-title`, description: `${id}-description` }
}

/** The view-facing surface a driver reads from the running dialog machine. */
export interface DialogApi {
  open: boolean
  role: DialogRole
  ids: DialogIds
  setOpen: (open: boolean) => void
  parts: {
    trigger: DialogPartBindings
    backdrop: DialogPartBindings
    viewport: DialogPartBindings
    content: DialogPartBindings
    title: DialogPartBindings
    description: DialogPartBindings
    close: DialogPartBindings
  }
}

export const dialogConnect: Connect<
  DialogStateName,
  DialogContext,
  DialogMachineEvent,
  DialogOptions,
  DialogApi
> = ({ state, context, props, send }) => {
  const open = state === 'open'
  const dataState: DialogStateName = open ? 'open' : 'closed'
  const ids = dialogIds(context.id)

  // An outside press is an intent, not a close command: the consumer may veto
  // it; whether it dismisses is gated in the machine.
  const onOutsidePress = (event?: PointerPayload): void => {
    props.onInteractOutside?.(event)
    if (event?.defaultPrevented !== true) send({ type: 'interact.outside' })
  }

  return {
    open,
    role: context.role,
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
        onPress: onOutsidePress,
      },
      viewport: {
        'data-state': dataState,
        onPress: onOutsidePress,
      },
      content: {
        role: context.role,
        id: ids.content,
        modal: context.modal || undefined,
        labelledBy: context.parts.title ? ids.title : undefined,
        describedBy: context.parts.description ? ids.description : undefined,
        // The initial focus target: focusable in script, not in the tab order.
        focusable: false,
        'data-state': dataState,
      },
      title: { id: ids.title },
      description: { id: ids.description },
      close: {
        onPress: () => send({ type: 'close' }),
      },
    },
  }
}

const reaction = makeReaction<DialogStateName, DialogContext, DialogMachineEvent, DialogOptions>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
// onOpenChange reads `open.intent`, not the state: a controlled machine
// reports intents without moving, and the prop-driven `controlled.sync`
// transition never writes an intent — the consumer's own change isn't echoed.
dialogConnect.reactions = [
  reaction(
    m => m.context.open.intent,
    (intent, props) => {
      if (intent !== null) props.onOpenChange?.(intent.value)
    },
  ),
]
