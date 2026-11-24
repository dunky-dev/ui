<script lang="ts">
  import { useFocusTrap } from '@dunky.dev/svelte-use-focus-trap'

  let { enabled, swapped = false }: { enabled?: () => boolean; swapped?: boolean } = $props()

  let target: HTMLDivElement | null = $state(null)
  // The getter defers the props read to each Tab press.
  useFocusTrap(() => target, { enabled: () => enabled?.() !== false })
</script>

{#if swapped}
  <div bind:this={target} tabindex="-1" data-testid="container">
    <button type="button">second first</button>
    <button type="button">second last</button>
  </div>
{:else}
  <div bind:this={target} tabindex="-1" data-testid="container">
    <button type="button">first</button>
    <button type="button">last</button>
  </div>
{/if}
