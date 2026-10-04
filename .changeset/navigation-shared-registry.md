---
'@dunky.dev/browser-navigation': patch
---

The guard registry now anchors on a realm-global keyed by `Symbol.for`,
matching `@dunky.dev/dom-overlay` and `@dunky.dev/dom-scroll-lock`. A monorepo
or micro-frontend can load more than one copy of this module into the same
page; each copy previously kept its own registry and `popstate` listener while
all of them shared the one real session history, so a Back could be answered
by the wrong copy — a swallowed press, or an entry planted twice. Every
duplicate copy now rendezvouses on the same registry, and only one listener is
ever attached (the store remembers it — the browser's listener dedupe can't
span copies, since each copy's function has its own identity). Resolved lazily
on first use, so `sideEffects: false` still holds.
