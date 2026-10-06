<script lang="ts">
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { useDialogContext } from './context.js'
  import type { DialogTriggerProps } from './types.js'

  let { children, ref = $bindable(null), ...rest }: DialogTriggerProps = $props()

  const dialog = useDialogContext()
  // `??`, not spread order: an explicit `type={undefined}` keeps the default.
  const attrs = $derived(
    mergeProps({ ...rest, type: rest.type ?? 'button' }, normalize(dialog.api.parts.trigger)),
  )
</script>

<button bind:this={ref} {...attrs}>{@render children?.()}</button>
