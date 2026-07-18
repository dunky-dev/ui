---
'@dunky.dev/dialog': patch
'@dunky.dev/react-dialog': patch
---

Make controlled `open` truly controlled. A dialog with the `open` prop set
never opens or closes on its own — it follows the prop alone. `onOpenChange`
now means exactly what it says: it fires on every actual open ⇄ close change,
whatever drove it (including a prop flip), and never for a dismissal that
changed nothing. Dismissal decisions happen at their source: `preventDefault()`
in `onEscapeKeyDown` / `onInteractOutside`, and your own handlers on
`Dialog.Trigger` / `Dialog.Close`.

```tsx
const [open, setOpen] = useState(true)

<Dialog
  open={open}
  onOpenChange={setOpen} // fires only when open actually changed
  onEscapeKeyDown={(e) => (canClose ? setOpen(false) : e.preventDefault())}
>
```

Controlled-ness is live, not fixed at mount: set `open` back to `undefined`
and the dialog takes over uncontrolled, right where it stands; supply the
prop again to retake control.

Previously an internal dismissal closed a controlled dialog immediately and
left it out of sync with the prop until the next flip.

`@dunky.dev/react-dialog` also now declares `react-dom` as a peer dependency
(it renders through a portal — strict installs previously couldn't resolve
it), and an explicit `id={undefined}` no longer discards the generated
SSR-safe id.
