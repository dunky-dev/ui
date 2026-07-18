import type { ToastMachine } from '@dunky.dev/toast'

// The per-provider registry: pure wiring between the shared viewport and the
// independent toast machines. It holds no behavior of its own — pause/resume
// are just intents broadcast to every machine, and each machine's state graph
// decides what they mean.
export interface ToastRegistry {
  /** Track a machine; returns the unregister. */
  register: (machine: ToastMachine) => () => void
  /** Broadcast the pause intent (viewport hovered/focused) to every toast. */
  pause: () => void
  /** Broadcast the resume intent (viewport left/blurred) to every toast. */
  resume: () => void
}

export function createToastRegistry(): ToastRegistry {
  const machines = new Set<ToastMachine>()
  let paused = false

  return {
    register(machine) {
      machines.add(machine)
      // The pause broadcast reaches late joiners too: a toast that mounts or
      // opens while the viewport is already hovered/focused joins paused.
      // Redelivering to an already-paused machine is a no-op by state graph.
      const deliverStandingPause = (): void => {
        if (paused) machine.send({ type: 'timer.pause' })
      }
      const unsubscribe = machine.select.state().subscribe(deliverStandingPause)
      deliverStandingPause()
      return () => {
        machines.delete(machine)
        unsubscribe()
      }
    },
    // Both intents are idempotent so the viewport can deliver them from every
    // raw signal it gets (enter, move, focus) without re-broadcasting.
    pause() {
      if (paused) return
      paused = true
      for (const machine of machines) machine.send({ type: 'timer.pause' })
    },
    resume() {
      if (!paused) return
      paused = false
      for (const machine of machines) machine.send({ type: 'timer.resume' })
    },
  }
}
