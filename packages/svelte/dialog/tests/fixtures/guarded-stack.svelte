<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let { open }: { open: boolean } = $props()
</script>

<Dialog {open} closeOnBack>
  <Dialog.Portal>
    <Dialog.Viewport>
      <Dialog.Content aria-label="outer">
        <Dialog {open} closeOnBack>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Content aria-label="inner" />
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
