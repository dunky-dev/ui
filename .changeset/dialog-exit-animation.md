---
'@dunky.dev/dialog': minor
'@dunky.dev/react-dialog': minor
'@dunky.dev/dom-overlay': minor
---

Add exit-animation support via a new `animated` option. An animated dialog
closes through a `closing` state — every part carries it as
`data-state="closing"`, the styling hook for the exit — and unmounts when its
transition or animation on Content ends (with a fallback ceiling, and skipped
entirely under `prefers-reduced-motion`).

```tsx
<Dialog animated>…</Dialog>
```

```css
[data-state='closing'] {
  opacity: 0;
  transition: opacity 150ms;
}
```

The exit window lives in the core machine, not in per-substrate unmount
deferral, so reopening mid-exit is a named transition instead of a timing
race, and every substrate inherits identical behavior. The exit is cosmetic
by design: the close is reported, focus returns, and the page becomes
interactive the moment closing starts — the still-painting layer is made
`inert` until it leaves. Enter animations need no option: parts mount
straight into `data-state="open"`, so CSS animations (or transitions via
`@starting-style`) play from mount. Default (`animated: false`) behavior is
unchanged.
