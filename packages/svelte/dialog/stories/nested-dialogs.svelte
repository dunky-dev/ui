<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
  import { actions, backdrop, content, viewport } from './styles.js'

  // "Close all" is consumer-side for now — `Close scope="stack"` is spec-only, so
  // the three layers are controlled and one handler drops them together. And a
  // controlled dialog never moves on its own: each layer decides its dismissals
  // at the source — its Trigger handler, its own action buttons, and the
  // dismissal callbacks (`onEscapeKeyDown` / `onInteractOutside`) — per the
  // controlled contract; `onOpenChange` only reports changes that actually
  // happened.
  let outerOpen = $state(true)
  let innerOpen = $state(false)
  let innermostOpen = $state(false)

  const closeAll = (): void => {
    innermostOpen = false
    innerOpen = false
    outerOpen = false
  }
</script>

<Dialog
  open={outerOpen}
  onOpenChange={next => (outerOpen = next)}
  onEscapeKeyDown={() => (outerOpen = false)}
  onInteractOutside={() => (outerOpen = false)}
>
  <Dialog.Trigger onclick={() => (outerOpen = true)}>Open outer</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop style={backdrop} />
    <Dialog.Viewport style={viewport}>
      <Dialog.Content style={content}>
        <Dialog.Title>Outer dialog</Dialog.Title>
        <Dialog.Description>
          Escape and outside presses dismiss the topmost dialog only — the stack unwinds one
          layer at a time.
        </Dialog.Description>
        <Dialog
          open={innerOpen}
          onOpenChange={next => (innerOpen = next)}
          onEscapeKeyDown={() => (innerOpen = false)}
          onInteractOutside={() => (innerOpen = false)}
        >
          <Dialog.Trigger onclick={() => (innerOpen = true)}>Open inner</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop style={backdrop} />
            <Dialog.Viewport style={viewport}>
              <Dialog.Content style={content}>
                <Dialog.Title>Inner dialog</Dialog.Title>
                <Dialog.Description>
                  While open, everything beneath — including the outer dialog — is inert and
                  hidden from assistive tech.
                </Dialog.Description>
                <Dialog
                  open={innermostOpen}
                  onOpenChange={next => (innermostOpen = next)}
                  onEscapeKeyDown={() => (innermostOpen = false)}
                  onInteractOutside={() => (innermostOpen = false)}
                >
                  <Dialog.Trigger onclick={() => (innermostOpen = true)}>
                    Open innermost
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Backdrop style={backdrop} />
                    <Dialog.Viewport style={viewport}>
                      <Dialog.Content style={content}>
                        <Dialog.Title>Innermost dialog</Dialog.Title>
                        <Dialog.Description>
                          Three layers deep. Escape and Close dismiss this layer only; Close all
                          unwinds the whole stack at once.
                        </Dialog.Description>
                        <div style={actions}>
                          <button onclick={closeAll}>Close all</button>
                          <button onclick={() => (innermostOpen = false)}>Close</button>
                        </div>
                      </Dialog.Content>
                    </Dialog.Viewport>
                  </Dialog.Portal>
                </Dialog>
                <div style={actions}>
                  <button onclick={() => (innerOpen = false)}>Close</button>
                </div>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
        <div style={actions}>
          <button onclick={() => (outerOpen = false)}>Close</button>
        </div>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
