<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let { onrun }: { onrun: () => void } = $props()

  const tracked = (_node: Element): { duration: number } => {
    onrun()
    return { duration: 0 }
  }
</script>

<Dialog>
  <Dialog.Trigger>Trigger</Dialog.Trigger>
  <Dialog.Portal>
    <div transition:tracked>
      <Dialog.Content aria-label="Transitioned">content</Dialog.Content>
    </div>
  </Dialog.Portal>
</Dialog>
