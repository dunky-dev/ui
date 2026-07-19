# @dunky.dev/dom-navigation

Framework-free browser-navigation helpers.

## Install

```sh
npm install @dunky.dev/dom-navigation
```

## interceptBackNavigation

Plants a guard entry in the session history so the host's Back dismisses an
overlaid layer — a dialog, drawer, sheet — instead of leaving the page.

```ts
import { interceptBackNavigation } from '@dunky.dev/dom-navigation'

// On open — arm the guard. `onBack` returns whether the layer closed.
const release = interceptBackNavigation(() => {
  close()
  return true // return false to veto: the guard re-arms for the next Back
})

// On close by any other means — release the guard.
release()
```

Guards stack, so a Back press unwinds one layer per press. Substrate bindings
wrap this — e.g. `@dunky.dev/react-dialog`'s `closeOnBack`.

## Reload

The guard entry survives a reload; the layer's open-state doesn't. A layer
opened transiently and then reloaded boots closed, leaving a dead same-URL
entry — so the first Back appears to do nothing.

The interceptor can't fix this: on reload only the host knows whether the layer
should reopen. So when a layer must survive reload (or be shareable, or reopen
on Forward), keep its open-state in the URL and derive the layer from it. Back
closes for free, and reload restores the layer because the URL says so.

```ts
// The URL is the source of truth — survives reload, no orphan to step over.
const isOpen = () => location.hash === '#dialog'

const open = () => history.pushState(null, '', '#dialog')
const close = () => {
  if (isOpen()) history.back()
}

// Re-render from isOpen() on every history change: Back, Forward, and reload.
window.addEventListener('popstate', render)
```

For a dialog that need not outlive a reload, `interceptBackNavigation` is
exactly right and needs none of this.
