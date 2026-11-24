<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import { guardBackNavigation, type BackNavigationGuard } from '@dunky.dev/dom-dialog'
  import { getParentDialogContext, setDialogContext } from './context.js'
  import type { DialogProps } from './types.js'
  import { useDialog } from './use-dialog.js'

  let { children, ...options }: DialogProps = $props()

  const generatedId = $props.id()
  // Nesting derives from the parent dialog's context (none = top-level).
  const depth = (getParentDialogContext()?.depth ?? 0) + 1
  const dialog = useDialog(() => options, generatedId)
  // Derived, so the edge below re-runs on an open change only — not on every
  // snapshot the machine publishes.
  const open = $derived(dialog.api.open)

  // The guard lives on the root — it concerns the dialog's openness, not any
  // rendered part. It spans more than the open state, so it can't be this
  // effect's teardown: a Back-close leaves the registration parked for the
  // Forward that may reopen it, and only the destroy ends the episode outright.
  let guard: BackNavigationGuard | null = null

  $effect(() => {
    const isOpen = open
    untrack(() => {
      if (!dialog.machine.context.closeOnBack) return
      guard ??= guardBackNavigation({
        backNavigate: () => dialog.api.backNavigate(),
        forwardNavigate: () => dialog.api.forwardNavigate(),
        isOpen: () => dialog.machine.matches('open'),
        depth,
      })
      guard.sync(isOpen)
    })
  })

  onDestroy(() => {
    guard?.release()
    guard = null
  })

  setDialogContext({
    get api() {
      return dialog.api
    },
    machine: dialog.machine,
    depth,
    container: null,
    backdropRef: { current: null },
  })
</script>

{@render children?.()}
