<script lang="ts">
  import { gateViewportPress } from '@dunky.dev/dom-dialog'
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { useDialogContext } from './context.js'
  import type { DialogViewportProps } from './types.js'

  let { children, ref = $bindable(null), ...rest }: DialogViewportProps = $props()

  const dialog = useDialogContext()

  const attrs = $derived(
    mergeProps(rest, gateViewportPress(dialog.machine.context.id, normalize(dialog.api.parts.viewport))),
  )
</script>

<div bind:this={ref} {...attrs}>{@render children?.()}</div>
