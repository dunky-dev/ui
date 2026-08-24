---
'@dunky.dev/browser-navigation': patch
---

Fix two `interceptBackNavigation` bugs around releases:

- Two guards released in the same synchronous turn no longer strand the
  shared `popstate` listener: the first release's idle check could detach it
  while the second release's self-caused pop was still in flight, leaving
  that pop uncounted — the next guard's first Back press was then misread as
  self-caused and its `onBack` never fired.
- A guard that releases itself inside its own `onBack` (a legal use of the
  public API) no longer evicts the guard beneath it: the handler now removes
  the answering guard by identity instead of positionally, so lower layers
  stay armed and keep their history entries.
