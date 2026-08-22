import type { __Name__Machine, __Name__Options } from '@dunky.dev/__name__'

// An effect as plain data: a setup/teardown function plus the prop names that
// re-run it. Structurally mirrors every adapter's ComponentEffect tuple, so a
// substrate's useMachine takes the list as-is and drives it with its own
// lifecycle. Once the core package grows its own effects.ts, import
// `__Name__Effect` from there instead of redeclaring it, and spread the core's
// list into the export below.
type __Name__Effect = [
  effect: (machine: __Name__Machine, props: __Name__Options) => (() => void) | void,
  deps: (keyof __Name__Options)[],
]

// Document-level work every DOM host owns, written once. A listener bound to
// `document` or `window` — or anything reading the DOM outside a part's own
// element — belongs here rather than in a substrate: React and Solid differ in
// how they schedule the effect, not in what it does.
//
// See @dunky.dev/dom-dialog for a worked example (the Escape listener, the
// open/exit sequences, the outside-press gating).
const trackDocument: __Name__Effect = [
  machine => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || machine.context.disabled) return
      machine.send({ type: 'SET_DISABLED', disabled: true })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  },
  [],
]

export const dom__Name__Effects: __Name__Effect[] = [trackDocument]
