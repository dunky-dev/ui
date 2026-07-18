import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { ToastMachine, ToastOptions, ToastStateName } from '@dunky.dev/toast'

// Substrate effects: prop-driven or platform work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type ToastEffect = ComponentEffect<ToastMachine, ToastOptions>

// Controlled open: follow the `open` prop in both directions.
const syncControlledOpen: ToastEffect = [
  (machine, props) => {
    if (props.open === undefined) return
    if (props.open !== !machine.matches('closed')) {
      machine.send({ type: props.open ? 'open' : 'close' })
    }
  },
  ['open'],
]

// The substrate owns the clock, the machine owns the decision: entering `open`
// schedules the dismiss timeout, leaving it (pause/close) cancels — so a late
// timeout can only ever deliver an elapse the state graph already ignores.
const scheduleDismissTimer: ToastEffect = [
  machine => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const sync = (state: ToastStateName): void => {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      if (state !== 'open') return
      const { duration } = machine.context
      // A non-finite duration means persistent — nothing to schedule.
      if (!Number.isFinite(duration)) return
      timer = setTimeout(() => machine.send({ type: 'timer.elapsed' }), duration)
    }

    const state = machine.select.state()
    const unsubscribe = state.subscribe(sync)
    sync(state.value)

    return () => {
      if (timer !== undefined) clearTimeout(timer)
      unsubscribe()
    }
  },
  [],
]

export const toastEffects: ToastEffect[] = [syncControlledOpen, scheduleDismissTimer]
