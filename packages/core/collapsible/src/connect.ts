import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type { AttrBindings, EventBindings } from '@dunky.dev/state-machine-bindings'
import type {
  CollapsibleContext,
  CollapsibleIds,
  CollapsibleMachineEvent,
  CollapsibleOptions,
  CollapsibleStateName,
} from './types'

// The bindings a part carries, drawn from the shared agnostic vocabulary; the
// index signature keeps parts assignable to the loose shape each substrate's
// normalize() accepts. `data-state` is the styling/animation hook.
export type CollapsiblePartBindings = EventBindings &
  AttrBindings & { 'data-state'?: CollapsibleStateName } & Record<string, unknown>

// The content id derives from the one base id, so the trigger's aria-controls
// and the content's id always agree.
function collapsibleIds(id: string): CollapsibleIds {
  return { content: `${id}-content` }
}

/** The view-facing surface a driver reads from the running collapsible machine. */
export interface CollapsibleApi {
  open: boolean
  disabled: boolean
  ids: CollapsibleIds
  setOpen: (open: boolean) => void
  parts: {
    trigger: CollapsiblePartBindings
    content: CollapsiblePartBindings
  }
}

export const collapsibleConnect: Connect<
  CollapsibleStateName,
  CollapsibleContext,
  CollapsibleMachineEvent,
  CollapsibleOptions,
  CollapsibleApi
> = ({ state, context, send }) => {
  const open = state === 'open'
  const dataState: CollapsibleStateName = open ? 'open' : 'closed'
  const dataDisabled = context.disabled ? '' : undefined
  const ids = collapsibleIds(context.id)

  return {
    open,
    disabled: context.disabled,
    ids,
    setOpen(next) {
      if (open === next) return
      send({ type: next ? 'open' : 'close' })
    },
    parts: {
      trigger: {
        expanded: open,
        // The content is always rendered, so the reference never dangles.
        controls: ids.content,
        disabled: context.disabled || undefined,
        'data-state': dataState,
        'data-disabled': dataDisabled,
        onPress: () => send({ type: 'toggle' }),
      },
      content: {
        id: ids.content,
        hidden: open ? undefined : true,
        'data-state': dataState,
        'data-disabled': dataDisabled,
      },
    },
  }
}

const reaction = makeReaction<
  CollapsibleStateName,
  CollapsibleContext,
  CollapsibleMachineEvent,
  CollapsibleOptions
>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
collapsibleConnect.reactions = [
  reaction(
    m => m.matches('open'),
    (open, props) => props.onOpenChange?.(open),
  ),
]
