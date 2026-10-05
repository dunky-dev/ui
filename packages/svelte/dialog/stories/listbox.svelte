<script lang="ts">
  import { listbox, option } from './styles.js'

  // A popup inside the dialog that never joins the layer stack — a third-party
  // listbox stands in. While it holds focus, Tab and Escape are its: the
  // dialog's trap and Escape stand down until focus is back in the window, so
  // one Escape closes the listbox and the next closes the dialog.
  const editors = ['Team members', 'Anyone with the link', 'Only me']

  let open = $state(false)
  let value = $state(editors[0])
  let button: HTMLButtonElement | null = $state(null)
  let list: HTMLUListElement | null = $state(null)

  const close = (): void => {
    open = false
    button?.focus()
  }

  const pick = (editor: string): void => {
    value = editor
    close()
  }

  $effect(() => {
    if (open) list?.querySelector<HTMLElement>('[role="option"]')?.focus()
  })
</script>

<div style="position: relative">
  <button
    bind:this={button}
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open ? 'true' : 'false'}
    aria-controls="who-can-edit"
    onclick={() => (open = !open)}
  >
    {value}
  </button>
  {#if open}
    <ul
      id="who-can-edit"
      bind:this={list}
      role="listbox"
      aria-label="Who can edit"
      style={listbox}
      onkeydown={event => {
        if (event.key === 'Escape') close()
        if (event.key === 'Tab') open = false
      }}
    >
      {#each editors as editor (editor)}
        <li
          role="option"
          tabindex="0"
          aria-selected={editor === value ? 'true' : 'false'}
          style={option}
          onclick={() => pick(editor)}
          onkeydown={event => {
            if (event.key === 'Enter' || event.key === ' ') pick(editor)
          }}
        >
          {editor}
        </li>
      {/each}
    </ul>
  {/if}
</div>
