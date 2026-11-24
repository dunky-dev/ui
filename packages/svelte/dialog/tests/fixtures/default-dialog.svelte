<script lang="ts">
  import { Dialog, type DialogProps } from '@dunky.dev/svelte-dialog'

  let props: DialogProps = $props()
</script>

<Dialog {...props}>
  <Dialog.Trigger>Trigger</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop data-testid="backdrop" />
    <Dialog.Viewport data-testid="viewport">
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
        <button type="button">Action</button>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
