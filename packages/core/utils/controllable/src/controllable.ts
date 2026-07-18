import { and, type Action, type Guard, type Transition } from '@dunky.dev/state-machine'

/**
 * The context slice for one consumer-ownable value. `controlled` is fixed at
 * build time — whether the consumer supplied the value and therefore owns it.
 * `intent` is the emission mailbox: a fresh token per open/close (or
 * equivalent) intent, so a reaction on it fires even when the intended value
 * repeats.
 */
export interface Controllable<Value> {
  controlled: boolean
  intent: { value: Value } | null
}

/** Seed a controllable slice from the consumer's option (undefined = uncontrolled). */
export function controllable<Value>(value: Value | undefined): Controllable<Value> {
  return { controlled: value !== undefined, intent: null }
}

/**
 * The sync event a substrate sends when the controlled value changes — the
 * only event that moves a controlled machine. One shared name keeps the
 * substrate<->core contract identical across primitives.
 */
export interface ControlledSync<Value> {
  type: 'controlled.sync'
  value: Value
}

/** The context keys holding a Controllable slice — what `gated` may target. */
type ControllableKey<Context> = {
  [Key in keyof Context]: Context[Key] extends Controllable<infer _V> ? Key : never
}[keyof Context]

interface GatedOptions<State extends string, Context extends object, Event, Value> {
  /** The behavior gate (e.g. closeOnEscape) applied in both modes. */
  guard?: Guard<Context, Event>
  /** Where the uncontrolled machine goes when the intent lands. */
  target: State
  /** The intended next value, reported through the mailbox. */
  value: Value
}

/**
 * Bind `gated` to a machine's generics once (the `makeReaction` idiom):
 *
 *   const gated = makeGated<DialogStateName, DialogContext, DialogMachineEvent>()
 *   // in a state's `on`:
 *   escape: gated('open', { guard: canEscape, target: 'closed', value: false })
 *
 * `gated` forks one intent event into two candidates — first guard wins:
 * controlled only writes the intent mailbox (the report the consumer may
 * veto by ignoring); uncontrolled also takes the transition. The `guard`
 * gates both, so dismissal settings are enforced before anything is reported.
 */
export function makeGated<
  State extends string,
  Context extends object,
  Event extends { type: string },
>(): <Key extends ControllableKey<Context> & string, Value>(
  key: Key,
  options: GatedOptions<State, Context, Event, Value>,
) => Array<Transition<State, Context, Event>> {
  return <Key extends ControllableKey<Context> & string, Value>(
    key: Key,
    { guard, target, value }: GatedOptions<State, Context, Event, Value>,
  ) => {
    // The one assertion the string-key API costs: TS can't connect
    // `Key extends ControllableKey<Context>` back to the shape of
    // `Context[Key]`, so the slice read is narrowed here, once.
    const sliceOf = (context: Context): Controllable<Value> => context[key] as Controllable<Value>

    const isControlled: Guard<Context, Event> = ({ context }) => sliceOf(context).controlled
    const request: Action<Context, Event> = ({ context, setContext }) => {
      // Fresh slice + fresh token: the mailbox fires on reference change. The
      // patch cast is TS again — a computed generic key widens to a string
      // index, which never satisfies Partial<Context> on its own.
      setContext({
        [key]: { controlled: sliceOf(context).controlled, intent: { value } },
      } as Partial<Context>)
    }
    return [
      { guard: guard ? and(guard, isControlled) : isControlled, actions: request },
      { guard, target, actions: request },
    ]
  }
}

/** Guard for the `controlled.sync` transitions: does the echoed value match? */
export function syncTo<Context extends object, Event extends { type: string }, Value>(
  value: Value,
): Guard<Context, Event> {
  return ({ event }) =>
    event.type === 'controlled.sync' && 'value' in event && event.value === value
}
