<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
</script>

<Dialog defaultOpen>
  <Dialog.Portal>
    <Dialog.Viewport>
      <Dialog.Content aria-label="Backdrop last">content</Dialog.Content>
    </Dialog.Viewport>
    <Dialog.Backdrop data-testid="backdrop" />
  </Dialog.Portal>
</Dialog>
