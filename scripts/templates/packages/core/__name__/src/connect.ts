import { makeReaction, type Connect } from '@dunky.dev/state-machine'
import type {
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options,
  __Name__StateName,
} from './types'

/** The view-facing surface a driver reads from the running __name__ machine. */
export interface __Name__Api {
  disabled: boolean
}

export const __camelName__Connect: Connect<
  __Name__StateName,
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options,
  __Name__Api
> = ({ context }) => ({ disabled: context.disabled })

const reaction = makeReaction<
  __Name__StateName,
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options
>()

// One reaction per consumer callback. Reactions fire in registration order within
// a single setContext — that order is the callback-order contract. See SPEC.md.
__camelName__Connect.reactions = [
  reaction(
    m => m.context.activateEvent,
    (event, props) => {
      if (event) props.onActivate?.()
    },
  ),
]
