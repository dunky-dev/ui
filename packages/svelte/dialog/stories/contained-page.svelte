<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
  import CloseButton from './close-button.svelte'
  import {
    appBranch,
    backdrop,
    branchPanel,
    branchViewport,
    closableContent,
    viewport,
  } from './styles.js'

  // Containment makes everything outside the topmost modal layer invisible to
  // assistive tech and unreachable by pointer, Tab, and find-in-page
  // (`aria-hidden` + `inert`) — but it keeps painting, so the story's `[inert]`
  // rule dims what containment hid to make the state visible. The panel is the
  // interesting half: it is non-modal (a select menu's habitat) and portalled
  // into the app branch, BESIDE page content. A branch holding a retained layer
  // is descended into rather than spared whole, so the article next to the
  // panel dims individually while the panel itself stays bright and reachable.
  //
  // `bind:this` fills after mount, so the panel waits for the branch.
  let branch: HTMLElement | null = $state(null)
</script>

<!-- A raw element, not a component <style>: Svelte would scope that rule to
     this component, and it has to reach the page around the portal. -->
{@html '<style>[inert] { opacity: 0.35; }</style>'}
<article>
  Page content at the canvas root — a body-level cousin of the dialog's portal.
  <button>Unreachable while the dialog is open</button>
</article>
<div bind:this={branch} style={appBranch}>
  <article>
    The app branch: the panel portals in here, right beside this article.
    <button>Unreachable too</button>
  </article>
</div>
<Dialog defaultOpen>
  <Dialog.Trigger>Open dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop style={backdrop} />
    <Dialog.Viewport style={viewport}>
      <Dialog.Content style={closableContent}>
        <CloseButton />
        <Dialog.Title>Containment</Dialog.Title>
        <Dialog.Description>
          Everything dimmed is aria-hidden and inert: Tab never reaches it, presses fall flat,
          screen readers see only this window. Open the panel — it lands inside the app branch,
          and the article beside it stays contained.
        </Dialog.Description>
        {#if branch}
          <Dialog modal={false}>
            <Dialog.Trigger>Open panel in the app branch</Dialog.Trigger>
            <Dialog.Portal container={branch}>
              <Dialog.Viewport style={branchViewport}>
                <Dialog.Content aria-label="Branch panel" style={branchPanel}>
                  A non-modal layer above the dialog, held out of the containment while its
                  neighbor article stays in it. Escape closes this layer first.
                </Dialog.Content>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog>
        {/if}
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
