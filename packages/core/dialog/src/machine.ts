import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import { controllable, intent, syncControlled } from '@dunky.dev/controllable'
import type { DialogContext, DialogMachineEvent, DialogOptions, DialogStateName } from './types'

/** The running dialog machine — what a substrate holds and sends events to. */
export type DialogMachine = Machine<DialogStateName, DialogContext, DialogMachineEvent>

type DialogAction = Action<DialogContext, DialogMachineEvent>
type DialogGuard = Guard<DialogContext, DialogMachineEvent>

const canEscape: DialogGuard = ({ context }) => context.closeOnEscape
const canDismissOutside: DialogGuard = ({ context }) => context.closeOnInteractOutside

// Every open/close intent is recorded in `open.intent`; whether it also
// transitions is intent's controlled/uncontrolled fork. `synced` is the full
// prop-echo handling: move on a matching echo, re-derive ownership on every one.
const intend = intent.as<DialogStateName, DialogContext, DialogMachineEvent>()
const synced = syncControlled.as<DialogStateName, DialogContext, DialogMachineEvent>()

const setPartPresence: DialogAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

export function dialogMachine(
  options: DialogOptions,
): TransitionConfig<DialogStateName, DialogContext, DialogMachineEvent> {
  const role = options.role ?? 'dialog'
  // Where a close lands, resolved at build like every seeded option: an
  // animated dialog holds an exit window open in `closing` until the substrate
  // reports the visual finished; otherwise closing is immediate.
  const exitTo: DialogStateName = options.animated === true ? 'closing' : 'closed'
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
          open: intend('open', { target: 'open', value: true }),
          toggle: intend('open', { target: 'open', value: true }),
          'controlled.sync': synced('open', { value: true, target: 'open' }),
        },
      },
      open: {
        on: {
          close: intend('open', { target: exitTo, value: false }),
          toggle: intend('open', { target: exitTo, value: false }),
          escape: intend('open', { guard: canEscape, target: exitTo, value: false }),
          'interact.outside': intend('open', {
            guard: canDismissOutside,
            target: exitTo,
            value: false,
          }),
          'controlled.sync': synced('open', { value: false, target: exitTo }),
        },
      },
      // The exit window (animated only; unreachable otherwise). The dialog is
      // already logically closed here — reported, released, yielded — so
      // dismissal intents don't apply; reopening interrupts the exit as a
      // named transition instead of a substrate-side race.
      closing: {
        on: {
          open: intend('open', { target: 'open', value: true }),
          toggle: intend('open', { target: 'open', value: true }),
          'exit.complete': { target: 'closed' },
          'controlled.sync': synced('open', { value: true, target: 'open' }),
        },
      },
    },
  })
}
