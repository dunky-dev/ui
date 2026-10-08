<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { Dialog } from '@dunky.dev/svelte-dialog'
  import AlertDialog from './alert-dialog.svelte'
  import CloseButton from './close-button.svelte'
  import ContainedPage from './contained-page.svelte'
  import ControlledDialog from './controlled-dialog.svelte'
  import Listbox from './listbox.svelte'
  import NestedDialogs from './nested-dialogs.svelte'
  import ScopedDialog from './scoped-dialog.svelte'
  import { actions, backdrop, closableContent, content, field, input, viewport } from './styles.js'

  // Each story is a static composition, like the React and Solid sets: `asChild`
  // renders the markup as-is, and `exportName` keeps the story ids identical
  // across substrates. A story that needs local state is a component of its own
  // in this folder — Svelte's unit of state.
  const { Story } = defineMeta({
    title: 'Primitives/Dialog',
    component: Dialog,
  })
</script>

{#snippet historyButtons()}
  <div style={actions}>
    <button onclick={() => window.history.back()}>Simulate browser Back</button>
    <button onclick={() => window.history.forward()}>Simulate browser Forward</button>
  </div>
{/snippet}

<Story exportName="standard" asChild>
  <Dialog defaultOpen>
    <Dialog.Trigger>Open dialog</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop style={backdrop} />
      <Dialog.Viewport style={viewport}>
        <Dialog.Content style={closableContent}>
          <CloseButton />
          <Dialog.Title>Rename board</Dialog.Title>
          <Dialog.Description>
            The new name is visible to everyone with access to this board. The corner button,
            Escape, and an outside press all dismiss.
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
</Story>

<Story exportName="alertDialog" asChild>
  <AlertDialog />
</Story>

<Story exportName="longContent" asChild>
  <Dialog defaultOpen>
    <Dialog.Trigger>Open terms</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop style={backdrop} />
      <Dialog.Viewport style={viewport}>
        <Dialog.Content style={closableContent}>
          <CloseButton />
          <Dialog.Title>Terms of service</Dialog.Title>
          <Dialog.Description>
            Content taller than the screen scrolls within the viewport layer.
          </Dialog.Description>
          {#each { length: 20 }, index}
            <p>
              {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </p>
          {/each}
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
</Story>

<Story exportName="loginForm" asChild>
  <Dialog defaultOpen>
    <Dialog.Trigger>Sign in</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop style={backdrop} />
      <Dialog.Viewport style={viewport}>
        <Dialog.Content style={closableContent}>
          <CloseButton />
          <Dialog.Title>Sign in</Dialog.Title>
          <Dialog.Description>
            Focus moves to the first field on open, and stays trapped inside while the dialog is
            open.
          </Dialog.Description>
          <form method="dialog" onsubmit={event => event.preventDefault()}>
            <label style={field}>
              Login
              <input style={input} name="login" type="text" autocomplete="username" />
            </label>
            <label style={field}>
              Password
              <input
                style={input}
                name="password"
                type="password"
                autocomplete="current-password"
              />
            </label>
            <div style={actions}>
              <button type="submit">Sign in</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
</Story>

<Story exportName="trigger" asChild>
  <Dialog>
    <Dialog.Trigger>Open dialog</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop style={backdrop} />
      <Dialog.Viewport style={viewport}>
        <Dialog.Content style={closableContent}>
          <CloseButton />
          <Dialog.Title>Closed by default</Dialog.Title>
          <Dialog.Description>Only the trigger renders until it is pressed.</Dialog.Description>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
</Story>

<Story exportName="controlled" asChild>
  <ControlledDialog />
</Story>

<Story exportName="scoped" asChild>
  <ScopedDialog />
</Story>

<Story exportName="nested" asChild>
  <NestedDialogs />
</Story>

<Story exportName="innerPopup" asChild>
  <Dialog defaultOpen>
    <Dialog.Trigger>Open dialog</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop style={backdrop} />
      <Dialog.Viewport style={viewport}>
        <Dialog.Content style={content}>
          <CloseButton />
          <Dialog.Title>Board settings</Dialog.Title>
          <Dialog.Description>
            Open the listbox, then press Tab and Escape: the popup answers first, the dialog only
            once it is closed.
          </Dialog.Description>
          <Listbox />
          <div style={actions}>
            <button>Save</button>
          </div>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
</Story>

<!-- closeOnBack turns the host's Back into a dismissal: while the dialog is
     open, a guard entry sits in the session history, so the browser's Back
     closes the dialog instead of leaving the page — what mobile users expect
     from a full-screen overlay. The spent entry survives in the forward stack,
     so the browser's Forward reopens what Back closed. The canvas has no
     browser chrome, so the buttons stand in for real presses by calling
     `history.back()` / `history.forward()`. -->
<Story exportName="closeOnBack" asChild>
  <Dialog defaultOpen closeOnBack>
    <Dialog.Trigger>Open dialog</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop style={backdrop} />
      <Dialog.Viewport style={viewport}>
        <Dialog.Content style={closableContent}>
          <CloseButton />
          <Dialog.Title>Rename board</Dialog.Title>
          <Dialog.Description>
            The browser's Back closes this dialog instead of navigating away. Press Back — or the
            button below, which stands in for it here — and the dialog dismisses while the page
            stays put. Forward, from the canvas, reopens it.
          </Dialog.Description>
          <div style={actions}>
            <button onclick={() => window.history.back()}>Simulate browser Back</button>
          </div>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
  <button onclick={() => window.history.forward()}>Simulate browser Forward</button>
</Story>

<!-- A stack of guards: every open layer plants its own history entry, so Back
     unwinds the stack one layer per press and Forward re-enters it one layer
     per press. Uncontrolled on purpose — a controlled dialog's Back-close is
     completed by the consumer, so its entry is consumed and Forward has
     nothing to re-enter (the `nested` story above is the controlled shape).

     Two sequences worth walking, with the in-dialog buttons or the canvas ones
     (the canvas is inert while any modal layer is open):

      1. Both open -> Back closes the inner only -> Forward reopens it. The
         outer never moves.
      2. Back, Back closes both -> Forward reopens the outer -> Forward again
         reopens the inner. Closing the outer unmounted the inner along with
         it, so the one that comes back is a different machine; it recognizes
         the entry as its own ground by its place in the stack. -->
<Story exportName="nestedCloseOnBack" asChild>
  <Dialog defaultOpen closeOnBack>
    <Dialog.Trigger>Open outer</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop style={backdrop} />
      <Dialog.Viewport style={viewport}>
        <Dialog.Content style={closableContent}>
          <CloseButton />
          <Dialog.Title>Outer dialog</Dialog.Title>
          <Dialog.Description>
            Two guard entries while both layers are open. Back closes the topmost one first.
          </Dialog.Description>
          <Dialog closeOnBack>
            <Dialog.Trigger>Open inner</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop style={backdrop} />
              <Dialog.Viewport style={viewport}>
                <Dialog.Content style={closableContent}>
                  <CloseButton />
                  <Dialog.Title>Inner dialog</Dialog.Title>
                  <Dialog.Description>
                    Back closes this layer and leaves the outer alone; Forward brings it back,
                    guarded again.
                  </Dialog.Description>
                  {@render historyButtons()}
                </Dialog.Content>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog>
          {@render historyButtons()}
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
  <button onclick={() => window.history.back()}>Simulate browser Back</button>
  <button onclick={() => window.history.forward()}>Simulate browser Forward</button>
</Story>

<Story exportName="containment" asChild>
  <ContainedPage />
</Story>
