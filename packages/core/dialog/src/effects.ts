import type { DialogMachine } from './machine'
import type { DialogOptions } from './types'

// A substrate effect as plain data: a setup/teardown function plus the prop
// names that re-run it. Structurally mirrors every adapter's ComponentEffect
// tuple — core can't import an adapter, and doesn't need to; each substrate's
// useMachine accepts the tuple as-is and drives it with its own lifecycle.
export type DialogEffect = [
  effect: (machine: DialogMachine, props: DialogOptions) => (() => void) | void,
  deps: (keyof DialogOptions)[],
]

// Controlled open: the machine never moves on its own when controlled — this
// echo of the `open` prop is the only thing that transitions it. It carries
// the prop verbatim: `undefined` hands the state back to the machine
// (uncontrolled again), a value (re)takes control. The mount echo no-ops.
//
// It lives in core because it's part of the controlled contract, not host
// wiring: every substrate must echo identically or the contract forks. A
// substrate composes host-specific effects (a DOM Escape listener, a hardware
// back handler) around this list; it never re-implements the echo.
export const dialogEffects: DialogEffect[] = [
  [
    (machine, props) => {
      machine.send({ type: 'controlled.sync', value: props.open })
    },
    ['open'],
  ],
]
