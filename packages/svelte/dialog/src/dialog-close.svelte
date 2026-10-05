<script lang="ts">
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { useDialogContext } from './context.js'
  import type { DialogCloseProps } from './types.js'

  let { children, ref = $bindable(null), ...rest }: DialogCloseProps = $props()

  const dialog = useDialogContext()
  const attrs = $derived(
    mergeProps({ type: 'button' as const, ...rest }, normalize(dialog.api.parts.close)),
  )
</script>

<button bind:this={ref} {...attrs}>{@render children?.()}</button>
