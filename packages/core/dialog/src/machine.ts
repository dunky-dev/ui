import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import { controlled, intent, syncControlled } from '@dunky.dev/controllable'
import type { DialogContext, DialogMachineEvent, DialogOptions, DialogStateName } from './types'

/** The running dialog machine — what a substrate holds and sends events to. */
export type DialogMachine = Machine<DialogStateName, DialogContext, DialogMachineEvent>

type DialogAction = Action<DialogContext, DialogMachineEvent>
type DialogGuard = Guard<DialogContext, DialogMachineEvent>

const canEscape: DialogGuard = ({ context }) => context.closeOnEscape
const canDismissOutside: DialogGuard = ({ context }) => context.closeOnInteractOutside

// Every open/close intent is reported through `open.intent` (the connect's
// reaction turns it into onOpenChange); whether it also transitions is
// intent's controlled/uncontrolled fork.
const request = intent.as<DialogStateName, DialogContext, DialogMachineEvent>()

const setPartPresence: DialogAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function dialogMachine(
  options: DialogOptions,
): TransitionConfig<DialogStateName, DialogContext, DialogMachineEvent> {
  const role = options.role ?? 'dialog'
  // Annotated so createMachine infers Context as DialogContext, not the narrowed literal.
  const context: DialogContext = {
    role,
    modal: options.modal ?? true,
    closeOnEscape: options.closeOnEscape ?? true,
    // An alert dialog interrupts for a response — an outside press must not
    // dismiss it unless explicitly opted in.
    closeOnInteractOutside: options.closeOnInteractOutside ?? role === 'dialog',
    open: controlled(options.open),
    // The substrate supplies a unique id; `dialog` is only a bare fallback.
    id: options.id ?? 'dialog',
    parts: { title: false, description: false },
  }

  return setup.as<DialogContext, DialogMachineEvent>().createMachine({
    initial: (options.open ?? options.defaultOpen) === true ? 'open' : 'closed',
    context,
    // Top-level: parts report their presence from any state.
    on: {
      'part.presence': { actions: setPartPresence },
    },
    states: {
      closed: {
        on: {
          open: request('open', { target: 'open', value: true }),
          toggle: request('open', { target: 'open', value: true }),
          'controlled.sync': { target: 'open', guard: syncControlled(true) },
        },
      },
      open: {
        on: {
          close: request('open', { target: 'closed', value: false }),
          toggle: request('open', { target: 'closed', value: false }),
          escape: request('open', { guard: canEscape, target: 'closed', value: false }),
          'interact.outside': request('open', {
            guard: canDismissOutside,
            target: 'closed',
            value: false,
          }),
          'controlled.sync': { target: 'closed', guard: syncControlled(false) },
        },
      },
    },
  })
}
