<script lang="ts">
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { use__Name__Context } from './context.js'
  import type { __Name__RootProps } from './types.js'

  // Placeholder part: wires the root bindings onto an element.
  // TODO(spec): replace with one part per piece of the anatomy in SPEC.md.
  let { children, ref = $bindable(null), ...rest }: __Name__RootProps = $props()

  const context = use__Name__Context()
  // `??`, not spread order: an explicit `type={undefined}` keeps the default.
  const attrs = $derived(
    mergeProps({ ...rest, type: rest.type ?? 'button' }, normalize(context.api.parts.root)),
  )
</script>

<button bind:this={ref} {...attrs}>{@render children?.()}</button>
