<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let { onrefs }: { onrefs: (refs: Record<string, HTMLElement | null>) => void } = $props()

  let trigger: HTMLButtonElement | null = $state(null)
  let backdrop: HTMLDivElement | null = $state(null)
  let viewport: HTMLDivElement | null = $state(null)
  let content: HTMLDivElement | null = $state(null)
  let title: HTMLHeadingElement | null = $state(null)
  let description: HTMLDivElement | null = $state(null)
  let close: HTMLButtonElement | null = $state(null)

  $effect(() => onrefs({ trigger, backdrop, viewport, content, title, description, close }))
</script>

<Dialog defaultOpen>
  <Dialog.Trigger bind:ref={trigger}>Trigger</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop bind:ref={backdrop} data-testid="backdrop" />
    <Dialog.Viewport bind:ref={viewport} data-testid="viewport">
      <Dialog.Content bind:ref={content}>
        <Dialog.Title bind:ref={title}>Title</Dialog.Title>
        <Dialog.Description bind:ref={description}>Description</Dialog.Description>
        <Dialog.Close bind:ref={close}>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
