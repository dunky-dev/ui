<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
</script>

<Dialog defaultOpen>
  <Dialog.Portal>
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Close>Close</Dialog.Close>
        <button type="button">Content</button>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
