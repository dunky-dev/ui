import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type { AttrBindings, EventBindings, PointerPayload } from '@dunky.dev/state-machine-bindings'
import type {
  PopoverContext,
  PopoverIds,
  PopoverMachineEvent,
  PopoverOptions,
  PopoverStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook.
export type PopoverPartBindings = EventBindings &
  AttrBindings & { 'data-state'?: PopoverStateName } & Record<string, unknown>

// The cross-part ids all derive from the one base id, so the trigger's
// aria-controls, Content's id, and the labelledby/describedby always agree.
function popoverIds(id: string): PopoverIds {
  return { content: `${id}-content`, title: `${id}-title`, description: `${id}-description` }
}

/** The view-facing surface a driver reads from the running popover machine. */
export interface PopoverApi {
  open: boolean
  ids: PopoverIds
  setOpen: (open: boolean) => void
  /**
   * Report a detected outside interaction. A popover has no backdrop to catch
   * presses, so detection is substrate work; this is where the intent enters —
   * the consumer's veto handler fires first, then the machine gates dismissal.
   */
  onInteractOutside: (event?: PointerPayload) => void
  parts: {
    trigger: PopoverPartBindings
    content: PopoverPartBindings
    title: PopoverPartBindings
    description: PopoverPartBindings
    close: PopoverPartBindings
  }
}

export const popoverConnect: Connect<
  PopoverStateName,
  PopoverContext,
  PopoverMachineEvent,
  PopoverOptions,
  PopoverApi
> = ({ state, context, props, send }) => {
  const open = state === 'open'
  const dataState: PopoverStateName = open ? 'open' : 'closed'
  const ids = popoverIds(context.id)

  return {
    open,
    ids,
    setOpen(next) {
      if (open === next) return
      send({ type: next ? 'open' : 'close' })
    },
    // An outside interaction is an intent, not a close command: the consumer
    // may veto it; whether it dismisses is gated in the machine.
    onInteractOutside(event) {
      props.onInteractOutside?.(event)
      if (event?.defaultPrevented !== true) send({ type: 'interact.outside' })
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
      content: {
        role: 'dialog',
        id: ids.content,
        // A popover coexists with the page — aria-modal only on explicit opt-in.
        modal: context.modal || undefined,
        labelledBy: context.parts.title ? ids.title : undefined,
        describedBy: context.parts.description ? ids.description : undefined,
        // The initial-focus fallback: focusable in script, not in the tab order.
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

const reaction = makeReaction<
  PopoverStateName,
  PopoverContext,
  PopoverMachineEvent,
  PopoverOptions
>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
// onOpenChange reads the intent mailbox, not the state: a controlled machine
// reports intents without moving, and the prop-driven `controlled.sync`
// transition never writes the mailbox — the consumer's own change isn't echoed.
popoverConnect.reactions = [
  reaction(
    m => m.context.openIntent,
    (intent, props) => {
      if (intent !== null) props.onOpenChange?.(intent.open)
    },
  ),
]
