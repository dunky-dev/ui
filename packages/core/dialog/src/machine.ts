import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import { controllable, gated, syncTo } from '@dunky.dev/controllable'
import type { DialogContext, DialogMachineEvent, DialogOptions, DialogStateName } from './types'

/** The running dialog machine — what a substrate holds and sends events to. */
export type DialogMachine = Machine<DialogStateName, DialogContext, DialogMachineEvent>

type DialogAction = Action<DialogContext, DialogMachineEvent>
type DialogGuard = Guard<DialogContext, DialogMachineEvent>

const canEscape: DialogGuard = ({ context }) => context.closeOnEscape
const canDismissOutside: DialogGuard = ({ context }) => context.closeOnInteractOutside

// Every open/close intent goes through the `open` mailbox (the connect's
// reaction turns it into onOpenChange); whether it also transitions is
// gated's controlled/uncontrolled fork.
const gate = gated.as<DialogStateName, DialogContext, DialogMachineEvent>()

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
    open: controllable(options.open),
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
          open: gate('open', { target: 'open', value: true }),
          toggle: gate('open', { target: 'open', value: true }),
          'controlled.sync': { target: 'open', guard: syncTo(true) },
        },
      },
      open: {
        on: {
          close: gate('open', { target: 'closed', value: false }),
          toggle: gate('open', { target: 'closed', value: false }),
          escape: gate('open', { guard: canEscape, target: 'closed', value: false }),
          'interact.outside': gate('open', {
            guard: canDismissOutside,
            target: 'closed',
            value: false,
          }),
          'controlled.sync': { target: 'closed', guard: syncTo(false) },
        },
      },
    },
  })
}
