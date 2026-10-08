import { defineComponent, h, ref, watch, type Component, type CSSProperties, type VNode } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Dialog } from '@dunky.dev/vue-dialog'

const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
}

export default meta
type StoryType = StoryObj<typeof Dialog>

// The stories are runtime-compiled templates, which resolve components by
// registered name — so the dotted part names an SFC resolves from the
// `Dialog` import are registered as such, derived from the parts themselves
// so none can be missed.
const dialogComponents: Record<string, Component> = { Dialog }
for (const [name, part] of Object.entries(Dialog)) {
  if (/^[A-Z]/.test(name)) dialogComponents[`Dialog.${name}`] = part as Component
}

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on every part is the real styling hook.
const backdrop: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
}
const viewport: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  overflow: 'auto',
  padding: '24px',
}
const content: CSSProperties = {
  // `margin: auto` inside the viewport's flex box does the centering;
  // `relative` makes the corner Close button pin to the window, not the page.
  position: 'relative',
  margin: 'auto',
  maxWidth: '480px',
  padding: '24px',
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
}
const actions: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '16px',
}
const closeIcon: CSSProperties = {
  position: 'absolute',
  top: '12px',
  insetInlineEnd: '12px',
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '18px',
  lineHeight: 1,
}
const field: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '12px',
}
const input: CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  font: 'inherit',
}
const listbox: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  minWidth: '220px',
  margin: '4px 0 0',
  padding: '4px',
  listStyle: 'none',
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: '6px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)',
}
const option: CSSProperties = {
  padding: '6px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
}
// A scoped dialog opens inside a container instead of over the whole page: it
// portals into that element, and its overlay layers switch from `fixed`
// (viewport-pinned) to `absolute` (container-pinned).
//
// CSS constraint: an `absolute` overlay can't stay fixed inside a *scrolling*
// element — it's positioned against the scroll origin and scrolls away. So the
// scrollable background goes in an inner scroller, wrapped by a NON-scrolling
// positioned boundary; the overlay pins to the boundary's visible box and the
// backdrop (a sibling on top of the scroller) blocks scrolling behind it.
const scopedBoundary: CSSProperties = {
  position: 'relative',
  height: '320px',
  overflow: 'hidden',
  border: '1px solid #ccc',
  borderRadius: '8px',
}
const scopedScroller: CSSProperties = {
  height: '100%',
  overflow: 'auto',
  padding: '16px',
  boxSizing: 'border-box',
}
const scopedBackdrop: CSSProperties = { ...backdrop, position: 'absolute' }
const scopedViewport: CSSProperties = { ...viewport, position: 'absolute' }

// Dialog.Close is the dialog's single dismissal affordance — the corner `×`,
// kept the focus cycle's last stop by the core contract. Buttons that act
// (Cancel / Confirm / Delete) are the consumer's own, driving the dialog
// through state — see the alertDialog story.
const closableContent: CSSProperties = { ...content, position: 'relative' }

// Containment makes everything outside the topmost modal layer invisible to
// assistive tech and unreachable by pointer, Tab, and find-in-page
// (`aria-hidden` + `inert`) — but it keeps painting, so the story's `[inert]`
// rule dims what containment hid to make the state visible. The panel is the
// interesting half: it is non-modal (a select menu's habitat) and portalled
// into the app branch, BESIDE page content. A branch holding a retained layer
// is descended into rather than spared whole, so the article next to the
// panel dims individually while the panel itself stays bright and reachable.
const appBranch: CSSProperties = {
  // The panel's absolute viewport pins to the branch.
  position: 'relative',
  marginTop: '16px',
  padding: '16px',
  border: '1px dashed #999',
  borderRadius: '8px',
}
const branchViewport: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  padding: '16px',
}
const branchPanel: CSSProperties = {
  margin: 'auto',
  maxWidth: '320px',
  padding: '16px',
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
}

const styles = {
  backdrop,
  viewport,
  content,
  actions,
  field,
  input,
  listbox,
  option,
  scopedBoundary,
  scopedScroller,
  scopedBackdrop,
  scopedViewport,
  closableContent,
  appBranch,
  branchViewport,
  branchPanel,
}

const CloseButton = defineComponent({
  components: dialogComponents,
  setup: () => ({ closeIcon }),
  template: `<Dialog.Close aria-label="Close" :style="closeIcon">&times;</Dialog.Close>`,
})

const components = { ...dialogComponents, CloseButton }

export const standard: StoryType = {
  render: () => ({
    components,
    setup: () => ({ styles }),
    template: `
      <Dialog default-open>
        <Dialog.Trigger>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.closableContent">
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
    `,
  }),
}

// The action row is the consumer's: Cancel/Delete do their work and close
// through state, so their Tab order is plain DOM order. Per the APG, a dialog
// confirming a destructive step starts focus on the least destructive action —
// `initialFocus` points at Cancel, through a getter: the template unwraps the
// ref before the button mounts.
export const alertDialog: StoryType = {
  render: () => ({
    components,
    setup: () => ({ open: ref(true), cancel: ref<HTMLButtonElement | null>(null), styles }),
    template: `
      <Dialog role="alertdialog" v-model:open="open" @escape-key-down="open = false">
        <Dialog.Trigger @click="open = true">Delete board</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.content" :initial-focus="() => cancel">
              <Dialog.Title>Delete board?</Dialog.Title>
              <Dialog.Description>
                This permanently deletes the board and its content for every member. This can't
                be undone. An outside press does not dismiss an alert dialog — choose an action.
              </Dialog.Description>
              <div :style="styles.actions">
                <button ref="cancel" @click="open = false">Cancel</button>
                <button @click="open = false">Delete</button>
              </div>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    `,
  }),
}

export const longContent: StoryType = {
  render: () => ({
    components,
    setup: () => ({ styles }),
    template: `
      <Dialog default-open>
        <Dialog.Trigger>Open terms</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.closableContent">
              <CloseButton />
              <Dialog.Title>Terms of service</Dialog.Title>
              <Dialog.Description>
                Content taller than the screen scrolls within the viewport layer.
              </Dialog.Description>
              <p v-for="index in 20" :key="index">
                {{ index }}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    `,
  }),
}

export const loginForm: StoryType = {
  render: () => ({
    components,
    setup: () => ({ styles }),
    template: `
      <Dialog default-open>
        <Dialog.Trigger>Sign in</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.closableContent">
              <CloseButton />
              <Dialog.Title>Sign in</Dialog.Title>
              <Dialog.Description>
                Focus moves to the first field on open, and stays trapped inside while the dialog is
                open.
              </Dialog.Description>
              <form method="dialog" @submit.prevent>
                <label :style="styles.field">
                  Login
                  <input :style="styles.input" name="login" type="text" autocomplete="username" />
                </label>
                <label :style="styles.field">
                  Password
                  <input
                    :style="styles.input"
                    name="password"
                    type="password"
                    autocomplete="current-password"
                  />
                </label>
                <div :style="styles.actions">
                  <button type="submit">Sign in</button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    `,
  }),
}

export const trigger: StoryType = {
  render: () => ({
    components,
    setup: () => ({ styles }),
    template: `
      <Dialog>
        <Dialog.Trigger>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.closableContent">
              <CloseButton />
              <Dialog.Title>Closed by default</Dialog.Title>
              <Dialog.Description>Only the trigger renders until it is pressed.</Dialog.Description>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    `,
  }),
}

// The consumer owns `open`; a controlled dialog never moves on its own, so
// every dismissal is decided at its source.
export const controlled: StoryType = {
  render: () => ({
    components,
    setup: () => ({ open: ref(false), styles }),
    template: `
      <button @click="open = true">Open from outside</button>
      <Dialog v-model:open="open" @interact-outside="open = false">
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.content">
              <Dialog.Title>Controlled</Dialog.Title>
              <Dialog.Description>
                The consumer owns \`open\`; dismissals are decided at their source.
              </Dialog.Description>
              <div :style="styles.actions">
                <button @click="open = false">Close</button>
              </div>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    `,
  }),
}

// The boundary's template ref fills on mount, before the trigger can be
// pressed — the portal reads a real element the moment it opens, so an open
// dialog never falls back to document.body.
export const scoped: StoryType = {
  render: () => ({
    components,
    setup: () => ({ boundary: ref<HTMLElement | null>(null), styles }),
    template: `
      <div ref="boundary" :style="styles.scopedBoundary">
        <div :style="styles.scopedScroller">
          <p v-for="index in 12" :key="index" style="margin: 0 0 8px">
            {{ index }}. Background content scrolls inside the panel; the trigger sits at the end.
          </p>
          <Dialog>
            <Dialog.Trigger>Open in panel</Dialog.Trigger>
            <Dialog.Portal :container="boundary">
              <Dialog.Backdrop :style="styles.scopedBackdrop" />
              <Dialog.Viewport :style="styles.scopedViewport">
                <Dialog.Content :style="styles.closableContent">
                  <CloseButton />
                  <Dialog.Title>Scoped dialog</Dialog.Title>
                  <Dialog.Description>
                    Portaled into the panel boundary; the backdrop and viewport are \`absolute\`, so the
                    overlay fills the panel's visible box and stays put while the background scrolls
                    behind it.
                  </Dialog.Description>
                </Dialog.Content>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog>
        </div>
      </div>
    `,
  }),
}

// "Close all" is consumer-side for now — the three layers are controlled and
// one handler drops them together. And a controlled dialog never moves on its
// own: each layer decides its dismissals at the source — its Trigger handler,
// its own action buttons, and the dismissal emits (`escape-key-down` /
// `interact-outside`) — per the controlled contract; `update:open` only
// reports changes that actually happened.
export const nested: StoryType = {
  render: () => ({
    components,
    setup() {
      const outerOpen = ref(true)
      const innerOpen = ref(false)
      const innermostOpen = ref(false)
      const closeAll = (): void => {
        innermostOpen.value = false
        innerOpen.value = false
        outerOpen.value = false
      }
      return { outerOpen, innerOpen, innermostOpen, closeAll, styles }
    },
    template: `
      <Dialog
        v-model:open="outerOpen"
        @escape-key-down="outerOpen = false"
        @interact-outside="outerOpen = false"
      >
        <Dialog.Trigger @click="outerOpen = true">Open outer</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.content">
              <Dialog.Title>Outer dialog</Dialog.Title>
              <Dialog.Description>
                Escape and outside presses dismiss the topmost dialog only — the stack unwinds one
                layer at a time.
              </Dialog.Description>
              <Dialog
                v-model:open="innerOpen"
                @escape-key-down="innerOpen = false"
                @interact-outside="innerOpen = false"
              >
                <Dialog.Trigger @click="innerOpen = true">Open inner</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop :style="styles.backdrop" />
                  <Dialog.Viewport :style="styles.viewport">
                    <Dialog.Content :style="styles.content">
                      <Dialog.Title>Inner dialog</Dialog.Title>
                      <Dialog.Description>
                        While open, everything beneath — including the outer dialog — is inert and
                        hidden from assistive tech.
                      </Dialog.Description>
                      <Dialog
                        v-model:open="innermostOpen"
                        @escape-key-down="innermostOpen = false"
                        @interact-outside="innermostOpen = false"
                      >
                        <Dialog.Trigger @click="innermostOpen = true">Open innermost</Dialog.Trigger>
                        <Dialog.Portal>
                          <Dialog.Backdrop :style="styles.backdrop" />
                          <Dialog.Viewport :style="styles.viewport">
                            <Dialog.Content :style="styles.content">
                              <Dialog.Title>Innermost dialog</Dialog.Title>
                              <Dialog.Description>
                                Three layers deep. Escape and Close dismiss this layer only; Close
                                all unwinds the whole stack at once.
                              </Dialog.Description>
                              <div :style="styles.actions">
                                <button @click="closeAll">Close all</button>
                                <button @click="innermostOpen = false">Close</button>
                              </div>
                            </Dialog.Content>
                          </Dialog.Viewport>
                        </Dialog.Portal>
                      </Dialog>
                      <div :style="styles.actions">
                        <button @click="innerOpen = false">Close</button>
                      </div>
                    </Dialog.Content>
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog>
              <div :style="styles.actions">
                <button @click="outerOpen = false">Close</button>
              </div>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    `,
  }),
}

// A popup inside the dialog that never joins the layer stack — a third-party
// listbox stands in. While it holds focus, Tab and Escape are its: the
// dialog's trap and Escape stand down until focus is back in the window, so
// one Escape closes the listbox and the next closes the dialog.
const editors = ['Team members', 'Anyone with the link', 'Only me']
const Listbox = defineComponent({
  setup() {
    const open = ref(false)
    const value = ref(editors[0])
    const button = ref<HTMLButtonElement | null>(null)
    const list = ref<HTMLUListElement | null>(null)
    const close = (): void => {
      open.value = false
      button.value?.focus()
    }
    const pick = (editor: string): void => {
      value.value = editor
      close()
    }
    const onListKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close()
      if (event.key === 'Tab') open.value = false
    }
    // Post-flush: the list has rendered by the time it takes focus.
    watch(
      open,
      isOpen => {
        if (isOpen) list.value?.querySelector<HTMLElement>('[role="option"]')?.focus()
      },
      { flush: 'post' },
    )
    return { open, value, button, list, pick, onListKeydown, editors, styles }
  },
  template: `
    <div style="position: relative">
      <button
        ref="button"
        type="button"
        aria-haspopup="listbox"
        :aria-expanded="open"
        aria-controls="who-can-edit"
        @click="open = !open"
      >
        {{ value }}
      </button>
      <ul
        v-if="open"
        id="who-can-edit"
        ref="list"
        role="listbox"
        aria-label="Who can edit"
        :style="styles.listbox"
        @keydown="onListKeydown"
      >
        <li
          v-for="editor in editors"
          :key="editor"
          role="option"
          tabindex="0"
          :aria-selected="editor === value"
          :style="styles.option"
          @click="pick(editor)"
          @keydown.enter="pick(editor)"
          @keydown.space="pick(editor)"
        >
          {{ editor }}
        </li>
      </ul>
    </div>
  `,
})

export const innerPopup: StoryType = {
  render: () => ({
    components: { ...components, Listbox },
    setup: () => ({ styles }),
    template: `
      <Dialog default-open>
        <Dialog.Trigger>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.content">
              <CloseButton />
              <Dialog.Title>Board settings</Dialog.Title>
              <Dialog.Description>
                Open the listbox, then press Tab and Escape: the popup answers first, the dialog only
                once it is closed.
              </Dialog.Description>
              <Listbox />
              <div :style="styles.actions">
                <button>Save</button>
              </div>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    `,
  }),
}

// closeOnBack turns the host's Back into a dismissal: while the dialog is open,
// a guard entry sits in the session history, so the browser's Back closes the
// dialog instead of leaving the page — what mobile users expect from a
// full-screen overlay. The spent entry survives in the forward stack, so the
// browser's Forward reopens what Back closed. The canvas has no browser
// chrome, so the buttons stand in for real presses by calling
// `history.back()` / `history.forward()`.
const simulate = {
  back: (): void => window.history.back(),
  forward: (): void => window.history.forward(),
}

export const closeOnBack: StoryType = {
  render: () => ({
    components,
    setup: () => ({ simulate, styles }),
    template: `
      <Dialog default-open close-on-back>
        <Dialog.Trigger>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.closableContent">
              <CloseButton />
              <Dialog.Title>Rename board</Dialog.Title>
              <Dialog.Description>
                The browser's Back closes this dialog instead of navigating away. Press Back — or the
                button below, which stands in for it here — and the dialog dismisses while the page
                stays put. Forward, from the canvas, reopens it.
              </Dialog.Description>
              <div :style="styles.actions">
                <button @click="simulate.back">Simulate browser Back</button>
              </div>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
      {{ ' ' }}
      <button @click="simulate.forward">Simulate browser Forward</button>
    `,
  }),
}

// A stack of guards: every open layer plants its own history entry, so Back
// unwinds the stack one layer per press and Forward re-enters it one layer per
// press. Uncontrolled on purpose — a controlled dialog's Back-close is
// completed by the consumer, so its entry is consumed and Forward has nothing
// to re-enter (the `nested` story above is the controlled shape).
//
// Two sequences worth walking, with the in-dialog buttons or the canvas ones
// (the canvas is inert while any modal layer is open):
//
//  1. Both open -> Back closes the inner only -> Forward reopens it. The outer
//     never moves.
//  2. Back, Back closes both -> Forward reopens the outer -> Forward again
//     reopens the inner. Closing the outer unmounted the inner along with it,
//     so the one that comes back is a different machine; it recognizes the
//     entry as its own ground by its place in the stack.
const HistoryButtons = defineComponent({
  setup: () => ({ simulate, actions }),
  template: `
    <div :style="actions">
      <button @click="simulate.back">Simulate browser Back</button>
      <button @click="simulate.forward">Simulate browser Forward</button>
    </div>
  `,
})

export const nestedCloseOnBack: StoryType = {
  render: () => ({
    components: { ...components, HistoryButtons },
    setup: () => ({ simulate, styles }),
    template: `
      <Dialog default-open close-on-back>
        <Dialog.Trigger>Open outer</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.closableContent">
              <CloseButton />
              <Dialog.Title>Outer dialog</Dialog.Title>
              <Dialog.Description>
                Two guard entries while both layers are open. Back closes the topmost one first.
              </Dialog.Description>
              <Dialog close-on-back>
                <Dialog.Trigger>Open inner</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop :style="styles.backdrop" />
                  <Dialog.Viewport :style="styles.viewport">
                    <Dialog.Content :style="styles.closableContent">
                      <CloseButton />
                      <Dialog.Title>Inner dialog</Dialog.Title>
                      <Dialog.Description>
                        Back closes this layer and leaves the outer alone; Forward brings it back,
                        guarded again.
                      </Dialog.Description>
                      <HistoryButtons />
                    </Dialog.Content>
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog>
              <HistoryButtons />
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
      {{ ' ' }}
      <button @click="simulate.back">Simulate browser Back</button>
      {{ ' ' }}
      <button @click="simulate.forward">Simulate browser Forward</button>
    `,
  }),
}

// A template ignores <style> tags, so the dimming rule renders from a function.
const InertDimming = (): VNode => h('style', '[inert] { opacity: 0.35; }')

export const containment: StoryType = {
  render: () => ({
    components: { ...components, InertDimming },
    setup: () => ({ branch: ref<HTMLElement | null>(null), styles }),
    template: `
      <InertDimming />
      <article>
        Page content at the canvas root — a body-level cousin of the dialog's portal.
        <button>Unreachable while the dialog is open</button>
      </article>
      <div ref="branch" :style="styles.appBranch">
        <article>
          The app branch: the panel portals in here, right beside this article.
          <button>Unreachable too</button>
        </article>
      </div>
      <Dialog default-open>
        <Dialog.Trigger>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop :style="styles.backdrop" />
          <Dialog.Viewport :style="styles.viewport">
            <Dialog.Content :style="styles.closableContent">
              <CloseButton />
              <Dialog.Title>Containment</Dialog.Title>
              <Dialog.Description>
                Everything dimmed is aria-hidden and inert: Tab never reaches it, presses fall flat,
                screen readers see only this window. Open the panel — it lands inside the app
                branch, and the article beside it stays contained.
              </Dialog.Description>
              <Dialog v-if="branch" :modal="false">
                <Dialog.Trigger>Open panel in the app branch</Dialog.Trigger>
                <Dialog.Portal :container="branch">
                  <Dialog.Viewport :style="styles.branchViewport">
                    <Dialog.Content aria-label="Branch panel" :style="styles.branchPanel">
                      A non-modal layer above the dialog, held out of the containment while its
                      neighbor article stays in it. Escape closes this layer first.
                    </Dialog.Content>
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    `,
  }),
}
