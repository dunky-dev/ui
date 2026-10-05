<script lang="ts">
  import { acceptsBackdropPress } from '@dunky.dev/dom-dialog'
  import { mergeProps, normalize } from '@dunky.dev/svelte-state-machine'
  import { useDialogContext } from './context.js'
  import type { DialogBackdropProps } from './types.js'

  let { children, ref = $bindable(null), ...rest }: DialogBackdropProps = $props()

  const dialog = useDialogContext()

  const attrs = $derived.by(() => {
    const { onclick, ...bindings } = normalize(dialog.api.parts.backdrop) as {
      onclick?: (event: MouseEvent) => void
    } & Record<string, unknown>
    return mergeProps(rest, {
      ...bindings,
      onclick: (event: MouseEvent) => {
        if (acceptsBackdropPress(dialog.machine.context.id)) onclick?.(event)
      },
    })
  })

  const bindElement = (element: HTMLDivElement | null): void => {
    ref = element
    dialog.backdropRef.current = element
  }
</script>

<!-- Only a modal dialog dims the page — non-modal coexists with it. -->
{#if dialog.machine.context.modal}
  <div bind:this={() => ref, bindElement} {...attrs}>{@render children?.()}</div>
{/if}
