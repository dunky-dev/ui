<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
</script>

<Dialog defaultOpen>
  <Dialog.Portal>
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Title>Outer</Dialog.Title>
        <Dialog defaultOpen escapeScope="stack">
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Content>
                <Dialog.Title>Inner</Dialog.Title>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
