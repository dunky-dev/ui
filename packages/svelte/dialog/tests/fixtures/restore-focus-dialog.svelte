<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let fallback: HTMLButtonElement | null = $state(null)
</script>

<button type="button" bind:this={fallback}>Fallback</button>
<Dialog>
  <Dialog.Trigger>Trigger</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Content aria-label="Settings" restoreFocus={() => fallback}>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog>
