---
'@dunky.dev/dom-dialog': minor
---

`startExitWindow` takes `inPlace`, with the layer's `viewport`, for a dialog
rendered without a portal. The exit window hides the still-painting layer by
walking up to the content's outermost ancestor below the portal container —
the layer itself when portalled, but for a layer that sits in the page's own
branch that walk takes the page around it out of interaction too. In place,
the hiding stops at the layer: from its viewport down, or the content alone
when it has none.

```ts
startExitWindow(content, { inPlace: true, viewport, backdrop, onComplete })
```

The option defaults off, so portalled dialogs and today's callers behave as
before. The Vue binding passes it for a `Content` rendered without a `Portal`.
