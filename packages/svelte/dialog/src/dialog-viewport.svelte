<script lang="ts">
  import { acceptsViewportPress } from '@dunky.dev/dom-dialog'
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { useDialogContext } from './context.js'
  import type { DialogViewportProps } from './types.js'

  let { children, ref = $bindable(null), ...rest }: DialogViewportProps = $props()

  const dialog = useDialogContext()

  const attrs = $derived.by(() => {
    const { onclick, ...bindings } = normalize(dialog.api.parts.viewport) as {
      onclick?: (event: MouseEvent) => void
    } & Record<string, unknown>
    return mergeProps(rest, {
      ...bindings,
      onclick: (event: MouseEvent) => {
        if (acceptsViewportPress(dialog.machine.context.id, event)) onclick?.(event)
      },
    })
  })
</script>

<div bind:this={ref} {...attrs}>{@render children?.()}</div>
