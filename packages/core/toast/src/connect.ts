import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type { AttrBindings, EventBindings } from '@dunky.dev/state-machine-bindings'
import type {
  ToastContext,
  ToastIds,
  ToastMachineEvent,
  ToastOptions,
  ToastStateName,
  ToastType,
} from './types'

// Open and paused are both "shown": pausing never disturbs styling/animation.
type ToastDataState = 'open' | 'closed'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook.
export type ToastPartBindings = EventBindings &
  AttrBindings & { 'data-state'?: ToastDataState } & Record<string, unknown>

// The cross-part ids all derive from the one base id, so Root's labelledby/
// describedby and the title/description ids always agree.
function toastIds(id: string): ToastIds {
  return { root: `${id}-root`, title: `${id}-title`, description: `${id}-description` }
}

/** The view-facing surface a driver reads from the running toast machine. */
export interface ToastApi {
  open: boolean
  type: ToastType
  ids: ToastIds
  setOpen: (open: boolean) => void
  parts: {
    root: ToastPartBindings
    title: ToastPartBindings
    description: ToastPartBindings
    action: ToastPartBindings
    close: ToastPartBindings
  }
}

export const toastConnect: Connect<
  ToastStateName,
  ToastContext,
  ToastMachineEvent,
  ToastOptions,
  ToastApi
> = ({ state, context, send }) => {
  const open = state !== 'closed'
  const dataState: ToastDataState = open ? 'open' : 'closed'
  const ids = toastIds(context.id)
  const close = (): void => send({ type: 'close' })

  return {
    open,
    type: context.type,
    ids,
    setOpen(next) {
      if (open === next) return
      send({ type: next ? 'open' : 'close' })
    },
    parts: {
      root: {
        // A status live region; the toast type only decides how assertively
        // it is announced.
        role: 'status',
        live: context.type === 'foreground' ? 'assertive' : 'polite',
        atomic: true,
        id: ids.root,
        labelledBy: context.parts.title ? ids.title : undefined,
        describedBy: context.parts.description ? ids.description : undefined,
        'data-state': dataState,
      },
      title: { id: ids.title },
      description: { id: ids.description },
      // Action and Close both dismiss; what the action does is the consumer's
      // own handler, composed by the substrate.
      action: { onPress: close },
      close: { onPress: close },
    },
  }
}

const reaction = makeReaction<ToastStateName, ToastContext, ToastMachineEvent, ToastOptions>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
// The selector spans open+paused, so pause/resume never reads as an open change.
toastConnect.reactions = [
  reaction(
    m => !m.matches('closed'),
    (open, props) => props.onOpenChange?.(open),
  ),
]
