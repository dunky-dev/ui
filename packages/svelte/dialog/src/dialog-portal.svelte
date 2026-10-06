<script lang="ts">
  import { getAllContexts, mount, unmount, untrack } from 'svelte'
  import { useDialogContext } from './context.js'
  import Layer from './dialog-layer.svelte'
  import type { DialogPortalProps } from './types.js'

  let { children, container = null }: DialogPortalProps = $props()

  const dialog = useDialogContext()
  // Svelte has no portal: the layers mount as a tree of their own in the
  // target, carrying this component's contexts so the parts below still find
  // the dialog. Effects never run on the server, so SSR renders nothing here.
  const contexts = getAllContexts()
  // `mounted`, not `open`: an animated dialog stays mounted through `closing`
  // so its exit visual can play.
  const mounted = $derived(dialog.api.mounted)

  $effect(() => {
    if (!mounted) return
    // Read here, so a container swap re-mounts the layers on the new target.
    const target = container ?? document.body
    // `intro: false`: unmount can't wait for an outro here, so Svelte
    // transitions stay off both ways — `data-state` animates the parts.
    const layer = untrack(() =>
      mount(Layer, {
        target,
        context: contexts,
        intro: false,
        props: {
          get children() {
            return children
          },
          get container() {
            return container
          },
        },
      }),
    )
    return () => {
      void unmount(layer)
    }
  })
</script>
