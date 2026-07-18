import { and, type Action, type Guard, type Transition } from '@dunky.dev/state-machine'

/**
 * A consumer-ownable value. `controlled` tracks whether the consumer supplies
 * the value right now — seeded at build, re-derived on every echo (see
 * `syncControlled`). `intent` is the last declared intent, written as a
 * fresh token so a reaction on it fires even on repeats.
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
 * The prop echo a substrate sends on change — the only event that moves a
 * controlled machine. `undefined` means the prop is gone: the machine stays
 * where it stands and goes back to owning the value (see `syncControlled`).
 */
export interface ControlledSync<Value> {
  type: 'controlled.sync'
  value: Value | undefined
}

/** The context keys holding a Controllable slice — what `intent` may target. */
type ControllableKey<Context> = {
  [Key in keyof Context]: Context[Key] extends Controllable<infer _V> ? Key : never
}[keyof Context]

interface IntentOptions<State extends string, Context extends object, Event, Value> {
  /** The behavior gate (e.g. closeOnEscape) applied in both modes. */
  guard?: Guard<Context, Event>
  /** Where the uncontrolled machine goes when the intent lands. */
  target: State
  /** The intended next value, reported through `intent`. */
  value: Value
}

type IntentFn<State extends string, Context extends object, Event extends { type: string }> = <
  Key extends ControllableKey<Context> & string,
  Value,
>(
  key: Key,
  options: IntentOptions<State, Context, Event, Value>,
) => Array<Transition<State, Context, Event>>

/**
 * Forks an intent event into two candidates — first guard wins: controlled
 * writes only `intent` (the consumer vetoes by ignoring it); uncontrolled
 * also takes the transition. `guard` gates both modes.
 *
 * Bare when the options carry the machine's types (a typed guard); pinned
 * otherwise — an unguarded call has nothing to infer from:
 *
 *   escape: intent('open', { guard: canEscape, target: 'closed', value: false })
 *
 *   const intend = intent.as<DialogStateName, DialogContext, DialogMachineEvent>()
 *   close: intend('open', { target: 'closed', value: false })
 */
export interface Intent {
  <
    // `const` keeps the target literal — inference otherwise widens it to string.
    const State extends string,
    Context extends object,
    Event extends { type: string },
    Key extends ControllableKey<Context> & string,
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
  Key extends ControllableKey<Context> & string,
  Value,
>(
  key: Key,
  { guard, target, value }: IntentOptions<State, Context, Event, Value>,
): Array<Transition<State, Context, Event>> {
  // TS can't relate Context[Key] back to Key's constraint — narrowed here, once.
  const sliceOf = (context: Context): Controllable<Value> => context[key] as Controllable<Value>

  const isControlled: Guard<Context, Event> = ({ context }) => sliceOf(context).controlled
  const request: Action<Context, Event> = ({ context, setContext }) => {
    // A fresh token each write so the intent reaction always fires. The cast:
    // a computed generic key widens to a string index, failing Partial<Context>.
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
  // Type-level only, like setup.as — the same implementation, generics pinned.
  as: <State extends string, Context extends object, Event extends { type: string }>(): IntentFn<
    State,
    Context,
    Event
  > => intentFn,
})

// Does the echoed value match?
function guardEcho<Context extends object, Event extends { type: string }, Value>(
  value: Value,
): Guard<Context, Event> {
  return ({ event }) =>
    event.type === 'controlled.sync' && 'value' in event && event.value === value
}

// Re-derives `controlled` from the echoed value's presence: `undefined` hands
// the value back to the machine where it stands, a value takes control.
function actEcho<
  Context extends object,
  Event extends { type: string },
  Key extends ControllableKey<Context> & string,
>(key: Key): Action<Context, Event> {
  return ({ event, context, setContext }) => {
    if (event.type !== 'controlled.sync') return
    const controlled = ('value' in event ? event.value : undefined) !== undefined
    // Same narrowing/patch casts as intent — see there.
    const slice = context[key] as Controllable<unknown>
    if (slice.controlled === controlled) return
    setContext({ [key]: { controlled, intent: slice.intent } } as Partial<Context>)
  }
}

interface SyncControlledOptions<State extends string, Value> {
  /** The echoed value that enters this transition's `target`. */
  value: Value
  /** Where a matching echo moves the machine. */
  target: State
}

type SyncControlledFn<
  State extends string,
  Context extends object,
  Event extends { type: string },
> = <Key extends ControllableKey<Context> & string, Value>(
  key: Key,
  options: SyncControlledOptions<State, Value>,
) => Array<Transition<State, Context, Event>>

/**
 * The full `controlled.sync` handling for one state: a matching echo moves to
 * `target`, and every echo — matching, opposite, or `undefined` — re-derives
 * who owns the value. Pin like `intent`:
 *
 *   const synced = syncControlled.as<DialogStateName, DialogContext, DialogMachineEvent>()
 *   closed: { on: { 'controlled.sync': synced('open', { value: true, target: 'open' }) } }
 */
export interface SyncControlled {
  <
    // `const` keeps the target literal — inference otherwise widens it to string.
    const State extends string,
    Context extends object,
    Event extends { type: string },
    Key extends ControllableKey<Context> & string,
    Value,
  >(
    key: Key,
    options: SyncControlledOptions<State, Value>,
  ): Array<Transition<State, Context, Event>>
  as<
    State extends string,
    Context extends object,
    Event extends { type: string },
  >(): SyncControlledFn<State, Context, Event>
}

function syncControlledFn<
  State extends string,
  Context extends object,
  Event extends { type: string },
  Key extends ControllableKey<Context> & string,
  Value,
>(
  key: Key,
  { value, target }: SyncControlledOptions<State, Value>,
): Array<Transition<State, Context, Event>> {
  const act = actEcho<Context, Event, Key>(key)
  return [{ guard: guardEcho(value), target, actions: act }, { actions: act }]
}

export const syncControlled: SyncControlled = Object.assign(syncControlledFn, {
  // Type-level only, like setup.as — the same implementation, generics pinned.
  as: <
    State extends string,
    Context extends object,
    Event extends { type: string },
  >(): SyncControlledFn<State, Context, Event> => syncControlledFn,
})
