import { setup, type Action, type Machine, type TransitionConfig } from '@dunky.dev/state-machine'
import type { ToastContext, ToastMachineEvent, ToastOptions, ToastStateName } from './types'

/** The running toast machine — what a substrate holds and sends events to. */
export type ToastMachine = Machine<ToastStateName, ToastContext, ToastMachineEvent>

type ToastAction = Action<ToastContext, ToastMachineEvent>

const setPartPresence: ToastAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function toastMachine(
  options: ToastOptions,
): TransitionConfig<ToastStateName, ToastContext, ToastMachineEvent> {
  // Annotated so createMachine infers Context as ToastContext, not the narrowed literal.
  const context: ToastContext = {
    type: options.type ?? 'foreground',
    duration: options.duration ?? 5000,
    // The substrate supplies a unique id; `toast` is only a bare fallback.
    id: options.id ?? 'toast',
    parts: { title: false, description: false },
  }

  return setup.as<ToastContext, ToastMachineEvent>().createMachine({
    // Rendering an uncontrolled toast is the intent to show it — open by default.
    initial: (options.open ?? options.defaultOpen ?? true) ? 'open' : 'closed',
    context,
    // Top-level: parts report their presence from any state.
    on: {
      'part.presence': { actions: setPartPresence },
    },
    states: {
      closed: {
        on: {
          open: { target: 'open' },
        },
      },
      // `open` means "the dismiss timer is running": the substrate's timer
      // effect schedules on enter and cancels on exit.
      open: {
        on: {
          close: { target: 'closed' },
          'timer.elapsed': { target: 'closed' },
          'timer.pause': { target: 'paused' },
        },
      },
      // Shown with the timer suspended. No `timer.elapsed` here: a late elapse
      // from the scheduler can never dismiss a paused toast.
      paused: {
        on: {
          close: { target: 'closed' },
          'timer.resume': { target: 'open' },
        },
      },
    },
  })
}
