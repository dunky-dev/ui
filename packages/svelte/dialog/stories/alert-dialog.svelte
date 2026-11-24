<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
  import { actions, backdrop, content, viewport } from './styles.js'

  // The action row is the consumer's: Cancel/Delete do their work and close
  // through state, so their Tab order is plain DOM order. Per the APG, a dialog
  // confirming a destructive step starts focus on the least destructive action —
  // `initialFocus` points at Cancel, through a getter because `bind:this` fills
  // after this component initializes.
  let open = $state(true)
  let cancel: HTMLButtonElement | null = $state(null)
</script>

<Dialog
  role="alertdialog"
  {open}
  onOpenChange={next => (open = next)}
  onEscapeKeyDown={() => (open = false)}
>
  <Dialog.Trigger onclick={() => (open = true)}>Delete board</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop style={backdrop} />
    <Dialog.Viewport style={viewport}>
      <Dialog.Content style={content} initialFocus={() => cancel}>
        <Dialog.Title>Delete board?</Dialog.Title>
        <Dialog.Description>
          This permanently deletes the board and its content for every member. This can't be
          undone. An outside press does not dismiss an alert dialog — choose an action.
        </Dialog.Description>
        <div style={actions}>
          <button bind:this={cancel} onclick={() => (open = false)}>Cancel</button>
          <button onclick={() => (open = false)}>Delete</button>
        </div>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
