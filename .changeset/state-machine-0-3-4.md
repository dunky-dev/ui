---
'@dunky.dev/controllable': patch
'@dunky.dev/dialog': patch
'@dunky.dev/native-dialog': patch
'@dunky.dev/react-dialog': patch
'@dunky.dev/solid-dialog': patch
---

Update the state-machine packages to the 2026-10-04 release: runtime `0.3.4`
and the React (`0.3.5`), Solid (`0.3.1`), and native (`0.4.1`) adapters.
Bindings (`0.4.1`), utils (`0.4.0`), and the shared DOM translation (`0.1.0`)
are unchanged.

Every range moves together on purpose. The adapters pin the runtime exactly
(`@dunky.dev/state-machine: 0.3.4`), so the floor of every caret moves with
them. On the old `^0.3.3`, an install that already held `0.3.3` had no reason
to move it, and upgrading only a binding then put two physical copies of the
runtime side by side: `0.3.3` for the core packages and `0.3.4` for the
adapter — the dependency diamond `ARCHITECTURE.md` warns about, where anything
identity-sensitive silently stops agreeing across the copies. `^0.3.4` rules
`0.3.3` out, so the tree resolves to a single runtime.

Nothing changes in how the components behave. The runtime release is internal
— fewer allocations on the send path (about 7% more single-event throughput on
its benchmark suite), and `after` timers now join the same run-to-completion
queue as any send, which no primitive here uses — and its type surface is
identical. The adapters only move their runtime pin.
