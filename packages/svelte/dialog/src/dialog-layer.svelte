<script lang="ts">
  import type { Snippet } from 'svelte'
  import { setDialogContext, useDialogContext } from './context.js'

  // The Portal's mounted tree: the portalled parts render here, in the target.
  let { children, container }: { children?: Snippet; container: HTMLElement | null } = $props()

  const dialog = useDialogContext()
  // Re-provide the context with the scoped container (null = page body) so
  // Content locks the right scroll surface.
  setDialogContext({
    get api() {
      return dialog.api
    },
    machine: dialog.machine,
    depth: dialog.depth,
    get container() {
      return container
    },
    backdropRef: dialog.backdropRef,
  })
</script>

{@render children?.()}
