<script lang="ts">
  import { onMount } from 'svelte'
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { useDialogContext } from './context.js'
  import type { DialogDescriptionProps } from './types.js'

  let { children, ref = $bindable(null), ...rest }: DialogDescriptionProps = $props()

  const dialog = useDialogContext()
  const attrs = $derived(mergeProps(rest, normalize(dialog.api.parts.description)))

  onMount(() => {
    dialog.machine.send({ type: 'part.presence', part: 'description', present: true })
    return () => dialog.machine.send({ type: 'part.presence', part: 'description', present: false })
  })
</script>

<div bind:this={ref} {...attrs}>{@render children?.()}</div>
