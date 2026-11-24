<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let { showTitle = true, showDescription = true }: { showTitle?: boolean; showDescription?: boolean } =
    $props()
</script>

<!-- No Portal: the parts mount in the root's own tree, so their mount effects
     run before the root's — the machine hasn't started when they report. -->
<Dialog defaultOpen>
  <Dialog.Content aria-label="Fallback label">
    {#if showTitle}
      <Dialog.Title>Title</Dialog.Title>
    {/if}
    {#if showDescription}
      <Dialog.Description>Description</Dialog.Description>
    {/if}
    <button type="button">Action</button>
  </Dialog.Content>
</Dialog>
