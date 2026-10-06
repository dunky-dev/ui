<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let { onfocus }: { onfocus?: () => void } = $props()
</script>

<Dialog>
  <Dialog.Trigger {onfocus}>Trigger</Dialog.Trigger>
</Dialog>
