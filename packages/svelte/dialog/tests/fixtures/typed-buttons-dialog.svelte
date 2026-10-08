<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let { type }: { type?: 'button' | 'submit' } = $props()
</script>

<Dialog defaultOpen>
  <Dialog.Trigger {type}>Trigger</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Content aria-label="Typed">
      <Dialog.Close {type}>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog>
