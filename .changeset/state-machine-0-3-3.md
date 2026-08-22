---
'@dunky.dev/controllable': patch
'@dunky.dev/dialog': patch
'@dunky.dev/native-dialog': patch
'@dunky.dev/react-dialog': patch
---

Update the state-machine packages to the 2026-08-22 release: runtime `0.3.3`,
bindings `0.4.1`, utils `0.4.0`, and the React (`0.3.4`), Solid (`0.3.0`), and
native (`0.4.0`) adapters.

Every range moves together on purpose. The published adapters pin the runtime
exactly (`@dunky.dev/state-machine: 0.3.3`), so a package left on an older
caret would have pulled a second physical copy of the runtime into a consumer's
install — the dependency diamond `ARCHITECTURE.md` warns about, where anything
identity-sensitive (a singleton, a `WeakMap`, module-level state) silently stops
agreeing across the two copies. `@dunky.dev/controllable` was the oldest
offender, still on `^0.1.0`; the tree now resolves to a single runtime.
