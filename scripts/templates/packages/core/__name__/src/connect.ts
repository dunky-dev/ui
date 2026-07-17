import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options,
  __Name__StateName,
} from './types'

/**
 * Logical bindings for one part. The substrate translates them into its own
 * attribute/handler vocabulary (e.g. `onPress` -> `onClick`). Grow this
 * vocabulary (expanded, controls, labelledBy, ...) as the parts need it.
 */
export interface __Name__PartBindings {
  id?: string
  disabled?: boolean
  'data-state'?: __Name__StateName
  onPress?: () => void
}

/** The view-facing surface a driver reads from the running __name__ machine. */
export interface __Name__Api {
  disabled: boolean
  parts: {
    // TODO(spec): one entry of logical bindings per part of the anatomy.
    root: __Name__PartBindings
  }
}

export const __camelName__Connect: Connect<
  __Name__StateName,
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options,
  __Name__Api
> = ({ state, context, send }) => ({
  disabled: context.disabled,
  parts: {
    root: {
      disabled: context.disabled || undefined,
      'data-state': state,
      onPress: () => send({ type: 'ACTIVATE' }),
    },
  },
})

const reaction = makeReaction<__Name__StateName, __Name__Context, __Name__MachineEvent, __Name__Options>()

// One reaction per consumer callback, firing in registration order — that
// order is the callback-order contract. A callback derivable from state
// selects it (e.g. `m => m.matches('open')`, see the dialog core); an event
// that doesn't move the machine emits through a mailbox slot, as here.
__camelName__Connect.reactions = [
  reaction(
    m => m.context.activateEvent,
    (event, props) => {
      if (event) props.onActivate?.()
    },
  ),
]
