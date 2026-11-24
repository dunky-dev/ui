<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let outerOpen = $state(true)
  let innerOpen = $state(false)
</script>

<Dialog
  open={outerOpen}
  onOpenChange={open => (outerOpen = open)}
  onEscapeKeyDown={() => (outerOpen = false)}
>
  <Dialog.Portal>
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Title>Outer</Dialog.Title>
        <Dialog
          open={innerOpen}
          onOpenChange={open => (innerOpen = open)}
          onEscapeKeyDown={() => (innerOpen = false)}
        >
          <Dialog.Trigger onclick={() => (innerOpen = true)}>Open inner</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Content>
                <Dialog.Title>Inner</Dialog.Title>
                <Dialog.Close onclick={() => (innerOpen = false)}>Close inner</Dialog.Close>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
