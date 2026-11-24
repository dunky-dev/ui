<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let { container }: { container: HTMLElement | null } = $props()
</script>

<Dialog defaultOpen>
  <Dialog.Portal {container}>
    <Dialog.Content aria-label="Scoped">content</Dialog.Content>
  </Dialog.Portal>
</Dialog>
