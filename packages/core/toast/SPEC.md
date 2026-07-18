# SPEC / Toast

## Reference

- **W3C pattern**: there is no APG toast pattern; the normative ground is
  [WAI-ARIA 1.2 `status`](https://www.w3.org/TR/wai-aria-1.2/#status) (a live
  region with implicit `aria-live`) plus the
  [APG alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) guidance
  that time-based messages must not steal focus.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix Toast (declarative, one
  component per toast — not an imperative toaster store), cross-checked against
  Base UI and Ark.

## Overview

A toast is a short, time-limited message that announces the outcome of an
action or a background event without interrupting the user's flow: it appears
in a dedicated region, is announced by assistive technology as a live update,
and dismisses itself after a duration — or earlier, when the user acts on it.
It is the opposite of a dialog: it must never take over interaction, never
steal focus, and never require an answer.

## Anatomy

One machine per toast. The Provider and Viewport are shared coordination
surfaces around the toasts — they carry configuration and the landmark, not
machine state — and each substrate provides them (see [Design](#design)).

```
<Provider>       — shared config: the default duration, the region's label
  |_ <Viewport>  — the landmark region listing the toasts; hovering or
     |             focusing it pauses every toast's timer
     |_ <Toast>            — root; owns one toast's state, renders nothing of its own
        |_ <Root>          — the toast surface: the announced live element
           |_ <Title>       — names the toast
           |_ <Description> — the toast's message body
           |_ <Action>      — an optional action; pressing it dismisses
           |_ <Close>       — the explicit dismissal affordance
```

## Behavior

Using the toast is a walkthrough of intent, not a prop list:

- The **root** owns one toast's open/close state, exposed controlled and
  uncontrolled, mirroring the dialog: a controlled consumer drives it from
  outside, and every open/close intent — including auto-dismiss — is reported
  back so the consumer stays in sync. The controlled prop is a synced input,
  not a gate: an internal dismissal (timer, Close, Action) still closes the
  toast, and the report is what lets the consumer mirror it back. A rendered
  uncontrolled toast is open by default: rendering it is the intent to show it.
- A toast **auto-dismisses** after its duration. The duration comes from the
  toast itself, falling back to the provider's default. A non-finite duration
  (`Infinity`) makes the toast persistent — it only dismisses on user action or
  from outside.
- Hovering or focusing the **viewport pauses** every toast's timer — the user
  is reading or about to act, so nothing may vanish under the pointer or
  focus. Leaving/blurring resumes. Resuming restarts the full duration (the
  [Design](#design) section records why).
- **Title / Description** name and describe the toast; the root's ARIA
  relationships always follow what is actually rendered — an omitted part never
  leaves a dangling reference.
- **Action** is the toast's optional interactive affordance (undo, retry).
  Pressing it dismisses the toast; the consumer's own handler decides what the
  action does.
- **Close** dismisses from inside — the explicit affordance for a user who
  won't wait out the timer, and what a persistent toast relies on.

## States

| State    | Behavior                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `closed` | Nothing is shown. An open intent (controlled prop, imperative open) moves to `open`.                                                                               |
| `open`   | The toast is visible and its dismiss timer runs. The timer elapsing, a Close/Action press, or an outside close intent dismisses; a pause intent moves to `paused`. |
| `paused` | The toast is visible with its timer suspended. A resume intent returns to `open` (restarting the duration); Close/Action and outside close intents still dismiss.  |

`open` and `paused` are both "shown" — parts expose `data-state="open"` for
either, so pausing never disturbs styling or animation.

### Timer

The machine owns the timing _decision_ as explicit states: entering `open`
means "the dismiss timer is running", `paused` means "it is suspended", and
the elapse is an ordinary event that only `open` accepts. The substrate owns
the _clock_: entering the timed state schedules a timeout for the toast's
duration that sends the elapse event; leaving it cancels the timeout. A late
or stray elapse can never dismiss a paused or closed toast — the state graph,
not the scheduler, is the authority.

## Accessibility

Per WAI-ARIA `status` and the Radix mapping:

- **Role**: the root is `role="status"` with an explicit politeness driven by
  the toast's type — `foreground` (the direct result of a user action) maps to
  `aria-live="assertive"`, `background` (a task the user didn't just perform)
  maps to `aria-live="polite"`. `aria-atomic` announces the whole toast on
  update.
- **No focus steal**: showing a toast never moves focus. Its controls are
  reached in the normal tab order through the viewport.
- **Focus survives dismissal**: dismissing the toast that holds focus moves
  focus to the viewport. Removing a focused element dispatches no blur, so
  parking focus there keeps the keyboard user's place in the region and keeps
  the viewport's focus-derived pause truthful.
- **Name**: the root is labelled by the rendered Title and described by the
  rendered Description, when present.
- **Viewport**: a `role="region"` landmark with an accessible label (the
  provider's `label`), so assistive-tech users can find pending toasts; the
  toasts are a list inside it.
- **Timing**: hover and focus pause the timer so the message stays readable
  and operable for keyboard and pointer users alike.

## Constraints

- A toast never steals focus and never blocks interaction with the page.
- Every open ⇄ close transition, whatever its cause (timer, Close, Action,
  outside intent), is reported to the consumer; pause/resume is not an
  open/close change and is never reported as one.
- ARIA labelled-by / described-by must only reference elements that are
  actually rendered.
- A dismiss timer can only elapse in `open`: pausing or closing invalidates
  any in-flight timer.
- Out of scope for v0, recorded as deliberate exclusions: swipe-to-dismiss
  gestures, an imperative `toast()` queue/store API, the F8 hotkey to jump to
  the viewport landmark, Escape-to-dismiss of the focused toast,
  toast stacking limits/queueing, and positioning — the consumer styles and
  positions the viewport.
- Also deferred, as a recorded limitation rather than a choice: the hidden
  announcer. The live element mounts together with its content, and a live
  region inserted pre-populated is announced unreliably by some screen
  readers — the Radix-style off-screen announcer that guarantees the initial
  announcement is a known v0 gap.

## Internals

- **One machine per toast; no store.** The Radix-style declarative shape wins
  over an imperative toaster: each rendered toast owns exactly one machine and
  the dialog's controlled/uncontrolled contract applies to it. A queue/store
  API can be layered on later without touching this core.
- **The substrate schedules, the machine decides.** The core has no clock: the
  `open`/`paused` split is the machine's, while the substrate's effect wires
  `setTimeout` to the state — enter `open`, schedule the duration; leave,
  cancel. Any substrate inherits identical pause/dismiss semantics by wiring
  one timer.
- **Resume restarts the full duration.** Resuming with the remaining time
  would need a clock inside the machine (or timing state inside the binding,
  which a binding must not own). Restarting keeps the timer contract fully in
  the state graph, and errs in the reader's favor — a paused toast gets its
  whole duration back. This deviates from Radix, which resumes with the
  remaining time.
- **Provider and Viewport are substrate surfaces.** They coordinate _between_
  machines — the default duration, the region landmark, broadcasting
  pause/resume to every registered toast — so they hold no machine state and
  make no decisions: a broadcast pause is just the pause intent delivered to
  each machine, and each machine's state graph decides what it means. A toast
  that starts (or opens) while the viewport is already hovered or focused
  joins paused — the broadcast reaches late joiners too.
- **Duration is read at toast creation.** Like every config option in this
  repo's cores, `duration` and `type` seed the machine context at build time;
  changing them on a live toast has no effect.
