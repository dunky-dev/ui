---
'@dunky.dev/native-dialog': minor
---

Hardware Back now dismisses the dialog by default: `closeOnBack` defaults to `true` on the native substrate (the core default stays `false`).

Back is Android's dismiss gesture for transient surfaces — native `Dialog`s are `cancelable` by default — and it plays the same role Escape does on the web, where `closeOnEscape` already defaults to `true`. Requiring an opt-in inverted that platform expectation. Opt out per dialog with `closeOnBack={false}`; the `onBackNavigation` veto is unchanged.
