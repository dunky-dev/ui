import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type { AttrBindings, EventBindings } from '@dunky.dev/state-machine-bindings'
import type {
  AlertDialogContext,
  AlertDialogIds,
  AlertDialogMachineEvent,
  AlertDialogOptions,
  AlertDialogStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook.
export type AlertDialogPartBindings = EventBindings &
  AttrBindings & { 'data-state'?: AlertDialogStateName } & Record<string, unknown>

// The cross-part ids all derive from the one base id, so the trigger's
// aria-controls, Content's labelledby/describedby, and the initial-focus
// policy's Cancel lookup always agree.
function alertDialogIds(id: string): AlertDialogIds {
  return {
    content: `${id}-content`,
    title: `${id}-title`,
    description: `${id}-description`,
    cancel: `${id}-cancel`,
  }
}

/** The view-facing surface a driver reads from the running alert-dialog machine. */
export interface AlertDialogApi {
  open: boolean
  ids: AlertDialogIds
  setOpen: (open: boolean) => void
  parts: {
    trigger: AlertDialogPartBindings
    backdrop: AlertDialogPartBindings
    viewport: AlertDialogPartBindings
    content: AlertDialogPartBindings
    title: AlertDialogPartBindings
    description: AlertDialogPartBindings
    cancel: AlertDialogPartBindings
    action: AlertDialogPartBindings
  }
}

export const alertDialogConnect: Connect<
  AlertDialogStateName,
  AlertDialogContext,
  AlertDialogMachineEvent,
  AlertDialogOptions,
  AlertDialogApi
> = ({ state, context, send }) => {
  const open = state === 'open'
  const dataState: AlertDialogStateName = open ? 'open' : 'closed'
  const ids = alertDialogIds(context.id)

  return {
    open,
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
      // Backdrop and viewport carry no press handler on purpose: an outside
      // interaction never dismisses an alert dialog.
      backdrop: {
        'data-state': dataState,
      },
      viewport: {
        'data-state': dataState,
      },
      content: {
        role: 'alertdialog',
        id: ids.content,
        // Always modal — modality is the pattern, not an option.
        modal: true,
        labelledBy: context.parts.title ? ids.title : undefined,
        describedBy: context.parts.description ? ids.description : undefined,
        // The initial-focus fallback target: focusable in script, not in the
        // tab order.
        focusable: false,
        'data-state': dataState,
      },
      title: { id: ids.title },
      description: { id: ids.description },
      cancel: {
        // The id is the initial-focus anchor: the substrate looks the least
        // destructive action up by it on open.
        id: ids.cancel,
        onPress: () => send({ type: 'close' }),
      },
      action: {
        onPress: () => send({ type: 'close' }),
      },
    },
  }
}

const reaction = makeReaction<
  AlertDialogStateName,
  AlertDialogContext,
  AlertDialogMachineEvent,
  AlertDialogOptions
>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
// onOpenChange reads the intent mailbox, not the state: a controlled machine
// reports intents without moving, and the prop-driven `controlled.sync`
// transition never writes the mailbox — the consumer's own change isn't echoed.
alertDialogConnect.reactions = [
  reaction(
    m => m.context.openIntent,
    (intent, props) => {
      if (intent !== null) props.onOpenChange?.(intent.open)
    },
  ),
]
