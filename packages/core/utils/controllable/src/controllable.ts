import { and, type Action, type Guard, type Transition } from '@dunky.dev/state-machine'

/**
 * The context slice for one consumer-ownable value. `controlled` is fixed at
 * build time — whether the consumer supplied the value and therefore owns it.
 * `intent` is the emission mailbox: a fresh token per open/close (or
 * equivalent) intent, so a reaction on it fires even when the intended value
 * repeats.
 */
export interface Controlled<Value> {
  controlled: boolean
  intent: { value: Value } | null
}

/** Seed a controlled slice from the consumer's option (undefined = uncontrolled). */
export function controlled<Value>(value: Value | undefined): Controlled<Value> {
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

/** The context keys holding a Controlled slice — what `intent` may target. */
type ControlledKey<Context> = {
  [Key in keyof Context]: Context[Key] extends Controlled<infer _V> ? Key : never
}[keyof Context]

interface IntentOptions<State extends string, Context extends object, Event, Value> {
  /** The behavior gate (e.g. closeOnEscape) applied in both modes. */
  guard?: Guard<Context, Event>
  /** Where the uncontrolled machine goes when the intent lands. */
  target: State
  /** The intended next value, reported through the mailbox. */
  value: Value
}

type IntentFn<State extends string, Context extends object, Event extends { type: string }> = <
  Key extends ControlledKey<Context> & string,
  Value,
>(
  key: Key,
  options: IntentOptions<State, Context, Event, Value>,
) => Array<Transition<State, Context, Event>>

/**
 * Forks one intent event into two candidates — first guard wins: controlled
 * only writes the intent mailbox (the report the consumer may veto by
 * ignoring); uncontrolled also takes the transition. The `guard` gates both,
 * so dismissal settings are enforced before anything is reported.
 *
 * Call it bare when the options carry the machine's types (a typed guard):
 *
 *   escape: intent('open', { guard: canEscape, target: 'closed', value: false })
 *
 * An unguarded call has nothing to infer Context/Event from — pin them once
 * with the `setup.as` idiom and reuse:
 *
 *   const request = intent.as<DialogStateName, DialogContext, DialogMachineEvent>()
 *   close: request('open', { target: 'closed', value: false })
 */
export interface Intent {
  <
    // `const` pins the target to its literal — plain inference widens it to
    // `string`, which no state union accepts.
    const State extends string,
    Context extends object,
    Event extends { type: string },
    Key extends ControlledKey<Context> & string,
    Value,
  >(
    key: Key,
    options: IntentOptions<State, Context, Event, Value>,
  ): Array<Transition<State, Context, Event>>
  as<State extends string, Context extends object, Event extends { type: string }>(): IntentFn<
    State,
    Context,
    Event
  >
}

function intentFn<
  State extends string,
  Context extends object,
  Event extends { type: string },
  Key extends ControlledKey<Context> & string,
  Value,
>(
  key: Key,
  { guard, target, value }: IntentOptions<State, Context, Event, Value>,
): Array<Transition<State, Context, Event>> {
  // The one assertion the string-key API costs: TS can't connect
  // `Key extends ControlledKey<Context>` back to the shape of
  // `Context[Key]`, so the slice read is narrowed here, once.
  const sliceOf = (context: Context): Controlled<Value> => context[key] as Controlled<Value>

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

export const intent: Intent = Object.assign(intentFn, {
  // Purely type-level, like setup.as — the same implementation, generics pinned.
  as: <State extends string, Context extends object, Event extends { type: string }>(): IntentFn<
    State,
    Context,
    Event
  > => intentFn,
})

/** Guard for the `controlled.sync` transitions: does the echoed value match? */
export function syncControlled<Context extends object, Event extends { type: string }, Value>(
  value: Value,
): Guard<Context, Event> {
  return ({ event }) =>
    event.type === 'controlled.sync' && 'value' in event && event.value === value
}
