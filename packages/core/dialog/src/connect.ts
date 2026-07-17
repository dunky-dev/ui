import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  DialogContext,
  DialogIds,
  DialogMachineEvent,
  DialogOptions,
  DialogRole,
  DialogStateName,
  DismissPayload,
} from './types'

/**
 * Logical bindings for one part. The substrate translates them into its own
 * attribute/handler vocabulary (e.g. `labelledBy` -> `aria-labelledby`,
 * `onPress` -> `onClick`).
 */
export interface DialogPartBindings {
  id?: string
  role?: DialogRole
  modal?: boolean
  hasPopup?: 'dialog'
  expanded?: boolean
  controls?: string
  labelledBy?: string
  describedBy?: string
  /** `false` marks the initial-focus target: focusable in script, not in the tab order. */
  focusable?: boolean
  'data-state'?: DialogStateName
  onPress?: (event?: DismissPayload) => void
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
  const { ids } = context

  // An outside press is an intent, not a close command: the consumer may veto
  // it; whether it dismisses is gated in the machine.
  const onOutsidePress = (event?: DismissPayload): void => {
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
dialogConnect.reactions = [
  reaction(
    m => m.matches('open'),
    (open, props) => props.onOpenChange?.(open),
  ),
]
