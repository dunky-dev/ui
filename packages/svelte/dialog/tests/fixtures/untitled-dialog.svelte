<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
</script>

<Dialog defaultOpen>
  <Dialog.Portal>
    <Dialog.Content aria-label="Settings">content</Dialog.Content>
  </Dialog.Portal>
</Dialog>
