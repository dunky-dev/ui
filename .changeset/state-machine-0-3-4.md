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
(`@dunky.dev/state-machine: 0.3.4`; the native adapter also pins the React
adapter at `0.3.5`), so the floor of every caret moves with them. Under the old
`^0.3.3`, an install that already held `0.3.3` had no reason to move it when an
adapter moved on, leaving two physical copies of the runtime side by side:
`0.3.3` for the core packages, `0.3.4` for the adapter. Anything
identity-sensitive in the runtime — a singleton, a `WeakMap`, module-level
state — silently stops agreeing across two copies. `^0.3.4` rules `0.3.3` out,
so the core packages and the adapters agree on `0.3.4`.

Component behavior is unchanged: the runtime release is internal to the runtime
and keeps its type surface identical, and the adapters change nothing but their
exact pins.
