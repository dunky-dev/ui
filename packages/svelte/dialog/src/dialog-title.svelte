<script lang="ts">
  import { onMount } from 'svelte'
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { useDialogContext } from './context.js'
  import type { DialogTitleProps } from './types.js'

  let { children, ref = $bindable(null), ...rest }: DialogTitleProps = $props()

  const dialog = useDialogContext()
  const attrs = $derived(mergeProps(rest, normalize(dialog.api.parts.title)))

  // Child effects run first, so this can report before the root's machine
  // starts — the transition applies to a stopped machine all the same.
  onMount(() => {
    dialog.machine.send({ type: 'part.presence', part: 'title', present: true })
    return () => dialog.machine.send({ type: 'part.presence', part: 'title', present: false })
  })
</script>

<h2 bind:this={ref} {...attrs}>{@render children?.()}</h2>
