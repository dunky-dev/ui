<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
</script>

<Dialog defaultOpen closeOnBack>
  <Dialog.Portal>
    <Dialog.Viewport>
      <Dialog.Content aria-label="outer">
        <Dialog closeOnBack>
          <Dialog.Trigger>open inner</Dialog.Trigger>
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
