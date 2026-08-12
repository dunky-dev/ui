---
'@dunky.dev/controllable': patch
'@dunky.dev/dialog': patch
'@dunky.dev/dom-focus-trap': patch
'@dunky.dev/dom-navigation': patch
'@dunky.dev/dom-overlay': patch
'@dunky.dev/dom-scroll-lock': patch
'@dunky.dev/overlay': patch
'@dunky.dev/react-dialog': patch
'@dunky.dev/react-use-focus-trap': patch
'@dunky.dev/react-use-scroll-lock': patch
---

Ship `SPEC.md` and the TypeScript sources in the published package, alongside
the built `dist`.

The tarball used to carry `dist` and `README.md` only, so the two things you
actually want when a behavior surprises you — the spec that defines the contract
and the code that implements it — were reachable only by finding the repo and
guessing which tag matches the installed version. Both now sit in
`node_modules/<pkg>/`, pinned to the exact version installed.

Nothing about resolution changes: `publishConfig` still points `main`, `types`,
and `exports` at `dist`, and the sources are inert payload — read them, don't
import them.
