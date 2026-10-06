<script lang="ts">
  import { untrack } from 'svelte'
  import { dialogTrapOptions, openDialogLayer, startExitWindow } from '@dunky.dev/dom-dialog'
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { useFocusTrap } from '@dunky.dev/svelte-use-focus-trap'
  import { useScrollLock } from '@dunky.dev/svelte-use-scroll-lock'
  import { useDialogContext } from './context.js'
  import type { DialogContentProps, DialogFocusTarget } from './types.js'

  let {
    children,
    ref = $bindable(null),
    initialFocus,
    restoreFocus,
    ...rest
  }: DialogContentProps = $props()

  const dialog = useDialogContext()
  const { machine, depth, backdropRef } = dialog
  const open = $derived(dialog.api.open)
  let content: HTMLDivElement | null = $state(null)

  const resolveFocusTarget = (target: DialogFocusTarget | undefined): HTMLElement | null =>
    (typeof target === 'function' ? target() : target) ?? null

  // The `open` state is the edge, not mount/destroy: an animated dialog stays
  // mounted through `closing`. One effect for both sides of it, because Svelte
  // runs each effect's teardown right before that effect's own re-run — with
  // two, a reopen would move focus in before the exit window lifted its
  // inertness. The sequences are the DOM package's; this ties them to
  // Svelte's lifecycle and reads everything but the edge untracked.
  $effect(() => {
    const isOpen = open
    if (dialog.bound === false) return
    return untrack(() => {
      if (content === null) return
      if (isOpen) {
        return openDialogLayer(content, {
          id: machine.context.id,
          depth,
          modal: machine.context.modal,
          backdrop: () => backdropRef.current,
          initialFocus: resolveFocusTarget(initialFocus),
          restoreFocus: () => resolveFocusTarget(restoreFocus),
          dismiss: () => machine.send({ type: 'close' }),
        })
      }
      // Mounted while not open only happens in `closing`.
      return startExitWindow(content, {
        container: dialog.container,
        backdrop: backdropRef.current,
        onComplete: () => machine.send({ type: 'exit.complete' }),
      })
    })
  })

  // The lock spans the whole mount — through `closing` too: releasing it
  // mid-exit would reflow the page under the still-painting layer. The
  // context's `null` means "page body", not the hook's "no target yet" — map
  // it to the hook's body default.
  useScrollLock(
    () => machine.context.modal,
    () => dialog.container ?? undefined,
  )

  useFocusTrap(
    () => content,
    dialogTrapOptions(machine, () => dialog.api.ids.close),
  )

  const attrs = $derived(mergeProps(rest, normalize(dialog.api.parts.content)))

  const bindElement = (element: HTMLDivElement | null): void => {
    ref = element
    content = element
  }
</script>

<!-- A neutral element with the role, not <dialog>: the window carries
     tabindex (forbidden on <dialog>), and this contract doesn't use
     showModal() — see SPEC.md. -->
<div bind:this={() => ref, bindElement} {...attrs}>{@render children?.()}</div>
