<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
  import CloseButton from './close-button.svelte'
  import {
    closableContent,
    scopedBackdrop,
    scopedBoundary,
    scopedScroller,
    scopedViewport,
  } from './styles.js'

  // `bind:this` fills after mount, so the Dialog subtree waits for the
  // boundary — an open dialog never briefly falls back to document.body.
  let boundary: HTMLElement | null = $state(null)
</script>

<div bind:this={boundary} style={scopedBoundary}>
  <div style={scopedScroller}>
    {#each { length: 12 }, index}
      <p style="margin: 0 0 8px">
        {index + 1}. Background content scrolls inside the panel; the trigger sits at the end.
      </p>
    {/each}
    {#if boundary}
      <Dialog>
        <Dialog.Trigger>Open in panel</Dialog.Trigger>
        <Dialog.Portal container={boundary}>
          <Dialog.Backdrop style={scopedBackdrop} />
          <Dialog.Viewport style={scopedViewport}>
            <Dialog.Content style={closableContent}>
              <CloseButton />
              <Dialog.Title>Scoped dialog</Dialog.Title>
              <Dialog.Description>
                Portaled into the panel boundary; the backdrop and viewport are `absolute`, so the
                overlay fills the panel's visible box and stays put while the background scrolls
                behind it.
              </Dialog.Description>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    {/if}
  </div>
</div>
