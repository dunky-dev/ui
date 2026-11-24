---
'@dunky.dev/dom-dialog': patch
'@dunky.dev/react-dialog': patch
'@dunky.dev/solid-dialog': patch
---

One Escape press closes at most one dialog — in a real browser too.

Each open dialog listens for Escape on the document and answers only while it
is the topmost layer. But a browser runs a microtask checkpoint between the
listeners of a user's key press, and that is where React, Solid, and Svelte
flush state: the dialog that answered had already left the stack when the next
dialog's listener asked whether it was topmost now — and it answered the same
press. One Escape closed a nested dialog together with the one beneath it, or
ran the outer dialog's `onEscapeKeyDown` guard for the inner dialog's press.
It took a lower dialog's listener running after the upper one's: a nested
stack that mounts open in one render (React runs a child's effects first), a
sibling dialog opened from inside another, or an `onEscapeKeyDown` that
changes identity after a nested dialog opened. Script-dispatched events run no
such checkpoint, so tests never saw it.

The dialog that takes a press now marks it answered, and every other dialog
stands down for it, whatever the answer: a close, a veto from
`onEscapeKeyDown`, a `closeOnEscape={false}` gate, or a controlled dialog's
intent that its consumer follows on the next render. A stack-scoped Escape
(`escapeScope: 'stack'`) still unwinds every layer, once. Copies of the
package loaded side by side on one page honor each other's answers, from this
version on. The dialog never calls `preventDefault()` on the event — that
remains the consumer's veto.

A press another handler already consumed — its default prevented, as popup
libraries do with the Escape they close on — no longer reaches
`onEscapeKeyDown` either. It could never close the dialog, but it still ran the
consumer's guard for a press that belonged to the popup.
