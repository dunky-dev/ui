<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
  import { actions, backdrop, content, viewport } from './styles.js'

  // The consumer owns `open`; a controlled dialog never moves on its own, so
  // every dismissal is decided at its source.
  let open = $state(false)
</script>

<button onclick={() => (open = true)}>Open from outside</button>
<Dialog {open} onOpenChange={next => (open = next)} onInteractOutside={() => (open = false)}>
  <Dialog.Portal>
    <Dialog.Backdrop style={backdrop} />
    <Dialog.Viewport style={viewport}>
      <Dialog.Content style={content}>
        <Dialog.Title>Controlled</Dialog.Title>
        <Dialog.Description>
          The consumer owns `open`; dismissals are decided at their source.
        </Dialog.Description>
        <div style={actions}>
          <button onclick={() => (open = false)}>Close</button>
        </div>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
