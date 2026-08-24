---
'@dunky.dev/browser-navigation': minor
'@dunky.dev/dom-dialog': patch
---

Rename `@dunky.dev/dom-navigation` to `@dunky.dev/browser-navigation`.

The util guards the browser's session history — Back, Forward, reload — and
never touches the DOM, so the old name pointed at the wrong layer. The API is
unchanged; only the package name moves:

```diff
-import { interceptBackNavigation } from '@dunky.dev/dom-navigation'
+import { interceptBackNavigation } from '@dunky.dev/browser-navigation'
```

`@dunky.dev/dom-navigation` will receive no further releases.
