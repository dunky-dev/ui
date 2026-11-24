<script lang="ts">
  import { Dialog, type DialogProps } from '@dunky.dev/svelte-dialog'

  let props: DialogProps = $props()
</script>

<Dialog defaultOpen {...props}>
  <Dialog.Portal>
    <Dialog.Backdrop data-testid="outer-backdrop" />
    <Dialog.Viewport data-testid="outer-viewport">
      <Dialog.Content>
        <Dialog.Title>Outer</Dialog.Title>
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Backdrop data-testid="inner-backdrop" />
            <Dialog.Viewport data-testid="inner-viewport">
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
