import { setup, type Action, type Guard, type TransitionConfig } from '@dunky.dev/state-machine'
import type {
  DialogContext,
  DialogIds,
  DialogMachineEvent,
  DialogOptions,
  DialogStateName,
} from './types'

type DialogAction = Action<DialogContext, DialogMachineEvent>
type DialogGuard = Guard<DialogContext, DialogMachineEvent>

const canEscape: DialogGuard = ({ context }) => context.closeOnEscape
const canDismissOutside: DialogGuard = ({ context }) => context.closeOnInteractOutside

const setPartPresence: DialogAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function createDialogConfig(
  options: DialogOptions,
  ids: DialogIds,
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
    ids,
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
          open: { target: 'open' },
          toggle: { target: 'open' },
        },
      },
      open: {
        on: {
          close: { target: 'closed' },
          toggle: { target: 'closed' },
          escape: { target: 'closed', guard: canEscape },
          'interact.outside': { target: 'closed', guard: canDismissOutside },
        },
      },
    },
  })
}
