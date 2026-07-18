---
'@dunky.dev/dialog': patch
'@dunky.dev/react-dialog': patch
---

Make controlled `open` truly controlled. A dialog with the `open` prop set no
longer opens or closes on its own: every intent — trigger press, Escape,
outside press, `Dialog.Close` — is still reported through `onOpenChange`, but
the dialog only moves when the prop does. Ignoring a report is now a working
veto:

```tsx
const [open, setOpen] = useState(true)

<Dialog
  open={open}
  // Decline the dismissal by not updating state — the dialog stays open.
  onOpenChange={(next) => canClose && setOpen(next)}
>
```

Previously an internal dismissal closed a controlled dialog immediately and
left it out of sync with the prop until the next prop flip. Prop-driven
transitions are no longer echoed back through `onOpenChange` — the consumer
already knows about its own change.

`@dunky.dev/react-dialog` also now declares `react-dom` as a peer dependency
(it renders through a portal — strict installs previously couldn't resolve
it), and an explicit `id={undefined}` no longer discards the generated
SSR-safe id.
