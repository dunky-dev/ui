---
'@dunky.dev/dom-scroll-lock': patch
---

`lockScroll` now saves, hides, and restores `overflow` per axis
(`overflow-x` / `overflow-y`), never via the shorthand. Per CSSOM the
`overflow` shorthand serializes back to `''` unless both longhands are set,
so a container that declares its scrolling on one axis only —

```tsx
<div style={{ overflowY: 'auto' }}>
```

— saved as "unset"; release then removed the consumer's own declaration and
the container stopped scrolling permanently. Restore now returns the inline
style to exactly what the first holder saw, as the contract promises.
