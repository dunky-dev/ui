<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let { disabled = false }: { disabled?: boolean } = $props()
  let initialFocus: HTMLInputElement | null = $state(null)
</script>

<Dialog defaultOpen>
  <Dialog.Portal>
    <Dialog.Viewport>
      <Dialog.Content aria-label="Form" initialFocus={() => initialFocus}>
        <input bind:this={initialFocus} {disabled} aria-label="Name" />
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
