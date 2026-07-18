import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type { TooltipContext, TooltipMachineEvent, TooltipOptions, TooltipStateName } from './types'

/** The running tooltip machine — what a substrate holds and sends events to. */
export type TooltipMachine = Machine<TooltipStateName, TooltipContext, TooltipMachineEvent>

type TooltipAction = Action<TooltipContext, TooltipMachineEvent>
type TooltipGuard = Guard<TooltipContext, TooltipMachineEvent>

// The press-then-focus suppression (see SPEC.md Design): a trigger press arms
// the flag, the focus it causes consumes it instead of opening. Some browsers
// never focus a pressed button (Safari and Firefox on macOS, touch taps), so
// the `press` (click) that ends every activation sequence — or blur — disarms
// a flag no focus ever consumed.
const focusOpenSuppressed: TooltipGuard = ({ context }) => context.focusOpenSuppressed
const suppressFocusOpen: TooltipAction = ({ setContext }) =>
  setContext({ focusOpenSuppressed: true })
const releaseFocusOpen: TooltipAction = ({ setContext }) =>
  setContext({ focusOpenSuppressed: false })

export function tooltipMachine(
  options: TooltipOptions,
): TransitionConfig<TooltipStateName, TooltipContext, TooltipMachineEvent> {
  // Annotated so createMachine infers Context as TooltipContext, not the narrowed literal.
  const context: TooltipContext = {
    openDelay: options.openDelay ?? 700,
    closeDelay: options.closeDelay ?? 300,
    // The substrate supplies a unique id; `tooltip` is only a bare fallback.
    id: options.id ?? 'tooltip',
    focusOpenSuppressed: false,
  }

  return setup.as<TooltipContext, TooltipMachineEvent>().createMachine({
    initial: (options.open ?? options.defaultOpen) === true ? 'open' : 'closed',
    context,
    states: {
      closed: {
        on: {
          'pointer.enter': { target: 'opening' },
          'pointer.down': { actions: suppressFocusOpen },
          press: { actions: releaseFocusOpen },
          focus: [{ guard: focusOpenSuppressed, actions: releaseFocusOpen }, { target: 'open' }],
          blur: { actions: releaseFocusOpen },
          open: { target: 'open' },
        },
      },
      opening: {
        after: { openDelay: { target: 'open' } },
        on: {
          'pointer.leave': { target: 'closed' },
          'pointer.down': { target: 'closed', actions: suppressFocusOpen },
          press: { target: 'closed', actions: releaseFocusOpen },
          focus: { target: 'open' },
          blur: { target: 'closed', actions: releaseFocusOpen },
          escape: { target: 'closed' },
          open: { target: 'open' },
          close: { target: 'closed' },
        },
      },
      open: {
        on: {
          'pointer.leave': { target: 'closing' },
          'pointer.down': { target: 'closed', actions: suppressFocusOpen },
          press: { target: 'closed', actions: releaseFocusOpen },
          blur: { target: 'closed', actions: releaseFocusOpen },
          escape: { target: 'closed' },
          close: { target: 'closed' },
        },
      },
      closing: {
        after: { closeDelay: { target: 'closed' } },
        on: {
          'pointer.enter': { target: 'open' },
          'pointer.down': { target: 'closed', actions: suppressFocusOpen },
          press: { target: 'closed', actions: releaseFocusOpen },
          focus: { target: 'open' },
          blur: { target: 'closed', actions: releaseFocusOpen },
          escape: { target: 'closed' },
          open: { target: 'open' },
          close: { target: 'closed' },
        },
      },
    },
    // The delay durations live in context (seeded above), so the machine —
    // not a substrate — owns the timers.
    implementations: {
      delays: {
        openDelay: ({ context: current }) => current.openDelay,
        closeDelay: ({ context: current }) => current.closeDelay,
      },
    },
  })
}
