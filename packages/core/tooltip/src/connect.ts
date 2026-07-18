import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type { AttrBindings, EventBindings } from '@dunky.dev/state-machine-bindings'
import type {
  TooltipContext,
  TooltipIds,
  TooltipMachineEvent,
  TooltipOptions,
  TooltipStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook.
export type TooltipPartBindings = EventBindings &
  AttrBindings & { 'data-state'?: TooltipStateName } & Record<string, unknown>

function tooltipIds(id: string): TooltipIds {
  return { content: `${id}-content` }
}

/** The view-facing surface a driver reads from the running tooltip machine. */
export interface TooltipApi {
  /** Shown to the user: `open` or `closing`. `data-state` carries the full lifecycle. */
  open: boolean
  ids: TooltipIds
  setOpen: (open: boolean) => void
  parts: {
    trigger: TooltipPartBindings
    content: TooltipPartBindings
  }
}

export const tooltipConnect: Connect<
  TooltipStateName,
  TooltipContext,
  TooltipMachineEvent,
  TooltipOptions,
  TooltipApi
> = ({ state, context, send }) => {
  const shown = state === 'open' || state === 'closing'
  const ids = tooltipIds(context.id)
  const onPointerEnter = (): void => send({ type: 'pointer.enter' })
  const onPointerLeave = (): void => send({ type: 'pointer.leave' })

  return {
    open: shown,
    ids,
    // Imperative intent is immediate — it overrides a running delay, and the
    // machine ignores it when already there.
    setOpen(next) {
      send({ type: next ? 'open' : 'close' })
    },
    parts: {
      trigger: {
        // A dangling aria-describedby id is an a11y defect — only while shown.
        describedBy: shown ? ids.content : undefined,
        'data-state': state,
        onPointerEnter,
        onPointerLeave,
        onPointerDown: () => send({ type: 'pointer.down' }),
        // Activation (click) also covers keyboard Enter/Space, which fire no
        // pointer events — the user is acting, so the tooltip yields.
        onPress: () => send({ type: 'press' }),
        onFocus: () => send({ type: 'focus' }),
        onBlur: () => send({ type: 'blur' }),
      },
      content: {
        role: 'tooltip',
        id: ids.content,
        'data-state': state,
        // Hovering the content follows the same enter/leave rules as the
        // trigger (WCAG 1.4.13 — hoverable).
        onPointerEnter,
        onPointerLeave,
      },
    },
  }
}

const reaction = makeReaction<
  TooltipStateName,
  TooltipContext,
  TooltipMachineEvent,
  TooltipOptions
>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
tooltipConnect.reactions = [
  reaction(
    m => m.matches('open') || m.matches('closing'),
    (open, props) => props.onOpenChange?.(open),
  ),
]
