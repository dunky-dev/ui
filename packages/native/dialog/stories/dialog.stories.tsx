import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native'
import { Dialog } from '@dunky.dev/native-dialog'

// The story set mirrors packages/react/dialog — same names, same scenarios —
// minus the ones whose premise doesn't exist on this host: `scoped` (no
// container portals; a Modal owns the whole screen), `loginForm` (its point is
// the web focus trap; here the host manages focus), and `containment`
// (aria-hidden + inert containment is a DOM mechanism; the host Modal hides
// the page whole, so there is no branch to descend into).
const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
  decorators: [
    Story => (
      <View style={styles.screen}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type StoryType = StoryObj<typeof Dialog>

// The primitive ships headless — the story is the consumer, so it brings the
// styles.
const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  viewport: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 480,
    maxHeight: '80%',
    width: '100%',
    alignSelf: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  title: { fontSize: 17, fontWeight: '600', color: '#1c1e26' },
  description: { marginTop: 8, fontSize: 15, color: '#5b6172' },
  paragraph: { marginTop: 12, fontSize: 15, color: '#1c1e26' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#eceef2',
  },
  buttonBig: { paddingVertical: 14, paddingHorizontal: 28 },
  buttonText: { fontSize: 15, color: '#1c1e26' },
  buttonTextBig: { fontSize: 20 },
  buttonPrimary: { backgroundColor: '#3142c4' },
  buttonTextPrimary: { color: 'white' },
  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    // Unlike CSS, RN gives later siblings the top of the touch order — the
    // full-width Title would swallow the corner press without this.
    zIndex: 1,
  },
  closeIconText: { fontSize: 18, color: '#1c1e26' },
  hint: { fontSize: 17, color: '#5b6172' },
})

// Dialog.Close is the dialog's single dismissal affordance — the corner `×`.
// Buttons that act (Cancel / Confirm / Delete) are the consumer's own,
// driving the dialog through state — see the alertDialog story.
const CloseButton = () => (
  <Dialog.Close accessibilityLabel='Close' style={styles.closeIcon}>
    <Text style={styles.closeIconText}>×</Text>
  </Dialog.Close>
)

export const Standard: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger style={styles.button}>
        <Text style={styles.buttonText}>Open dialog</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={styles.backdrop} />
        <Dialog.Viewport style={styles.viewport}>
          <Dialog.Content style={styles.content}>
            <CloseButton />
            <Dialog.Title style={styles.title}>Rename board</Dialog.Title>
            <Dialog.Description style={styles.description}>
              The new name is visible to everyone with access to this board. The corner button and
              an outside press both dismiss.
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

// The action row is the consumer's: Cancel/Delete do their work and close
// through state. An alert dialog does not dismiss on an outside press —
// choose an action.
const AlertDialogStory = () => {
  const [open, setOpen] = useState(true)
  return (
    <Dialog role='alertdialog' open={open} onOpenChange={setOpen}>
      <Dialog.Trigger style={styles.button} onPress={() => setOpen(true)}>
        <Text style={styles.buttonText}>Delete board</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={styles.backdrop} />
        <Dialog.Viewport style={styles.viewport}>
          <Dialog.Content style={styles.content}>
            <Dialog.Title style={styles.title}>Delete board?</Dialog.Title>
            <Dialog.Description style={styles.description}>
              This permanently deletes the board and its content for every member. This can't be
              undone. An outside press does not dismiss an alert dialog — choose an action.
            </Dialog.Description>
            <View style={styles.actions}>
              <Pressable style={styles.button} onPress={() => setOpen(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => setOpen(false)}
              >
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Delete</Text>
              </Pressable>
            </View>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  )
}

export const AlertDialog: StoryType = {
  render: () => <AlertDialogStory />,
}

export const LongContent: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger style={styles.button}>
        <Text style={styles.buttonText}>Open terms</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={styles.backdrop} />
        <Dialog.Viewport style={styles.viewport}>
          <Dialog.Content style={styles.content}>
            <CloseButton />
            <Dialog.Title style={styles.title}>Terms of service</Dialog.Title>
            <Dialog.Description style={styles.description}>
              Content taller than the screen scrolls within the window.
            </Dialog.Description>
            <ScrollView>
              {Array.from({ length: 20 }, (_, index) => (
                <Text key={index} style={styles.paragraph}>
                  {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </Text>
              ))}
            </ScrollView>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

export const Trigger: StoryType = {
  render: () => (
    <Dialog>
      <Dialog.Trigger style={styles.button}>
        <Text style={styles.buttonText}>Open dialog</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={styles.backdrop} />
        <Dialog.Viewport style={styles.viewport}>
          <Dialog.Content style={styles.content}>
            <CloseButton />
            <Dialog.Title style={styles.title}>Closed by default</Dialog.Title>
            <Dialog.Description style={styles.description}>
              Only the trigger renders until it is pressed.
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

export const Controlled: StoryType = {
  render: function ControlledStory() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Pressable style={styles.button} onPress={() => setOpen(true)}>
          <Text style={styles.buttonText}>Open from outside</Text>
        </Pressable>
        <Dialog open={open} onOpenChange={setOpen} onInteractOutside={() => setOpen(false)}>
          <Dialog.Portal>
            <Dialog.Backdrop style={styles.backdrop} />
            <Dialog.Viewport style={styles.viewport}>
              <Dialog.Content style={styles.content}>
                <Dialog.Title style={styles.title}>Controlled</Dialog.Title>
                <Dialog.Description style={styles.description}>
                  The consumer owns `open`; dismissals are decided at their source.
                </Dialog.Description>
                <View style={styles.actions}>
                  <Pressable style={styles.button} onPress={() => setOpen(false)}>
                    <Text style={styles.buttonText}>Close</Text>
                  </Pressable>
                </View>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
      </>
    )
  },
}

// Each layer is its own Modal — RN stacks them natively. Escape has no analog
// here; each layer closes through its own affordances, and "Close all" unwinds
// the whole stack through state at once.
const NestedDialogs = () => {
  const [outerOpen, setOuterOpen] = useState(true)
  const [innerOpen, setInnerOpen] = useState(false)
  const closeAll = () => {
    setInnerOpen(false)
    setOuterOpen(false)
  }
  return (
    <Dialog
      open={outerOpen}
      onOpenChange={setOuterOpen}
      onInteractOutside={() => setOuterOpen(false)}
    >
      <Dialog.Trigger style={styles.button} onPress={() => setOuterOpen(true)}>
        <Text style={styles.buttonText}>Open outer</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={styles.backdrop} />
        <Dialog.Viewport style={styles.viewport}>
          <Dialog.Content style={styles.content}>
            <Dialog.Title style={styles.title}>Outer dialog</Dialog.Title>
            <Dialog.Description style={styles.description}>
              An outside press dismisses the topmost dialog only — the stack unwinds one layer at a
              time.
            </Dialog.Description>
            <Dialog
              open={innerOpen}
              onOpenChange={setInnerOpen}
              onInteractOutside={() => setInnerOpen(false)}
            >
              <Dialog.Trigger
                style={[styles.button, { marginTop: 16 }]}
                onPress={() => setInnerOpen(true)}
              >
                <Text style={styles.buttonText}>Open inner</Text>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop style={styles.backdrop} />
                <Dialog.Viewport style={styles.viewport}>
                  <Dialog.Content style={styles.content}>
                    <Dialog.Title style={styles.title}>Inner dialog</Dialog.Title>
                    <Dialog.Description style={styles.description}>
                      Its own native Modal, stacked by the host over the outer one.
                    </Dialog.Description>
                    <View style={styles.actions}>
                      <Pressable style={styles.button} onPress={closeAll}>
                        <Text style={styles.buttonText}>Close all</Text>
                      </Pressable>
                      <Pressable style={styles.button} onPress={() => setInnerOpen(false)}>
                        <Text style={styles.buttonText}>Close</Text>
                      </Pressable>
                    </View>
                  </Dialog.Content>
                </Dialog.Viewport>
              </Dialog.Portal>
            </Dialog>
            <View style={styles.actions}>
              <Pressable style={styles.button} onPress={() => setOuterOpen(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>
            </View>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  )
}

export const Nested: StoryType = {
  render: () => <NestedDialogs />,
}

// closeOnBack defaults to true on this substrate: the hardware Back press
// (Escape under react-native-web) dismisses instead of leaving.
export const CloseOnBack: StoryType = {
  render: () => (
    <>
      <Dialog>
        <Dialog.Trigger style={[styles.button, styles.buttonBig]}>
          <Text style={[styles.buttonText, styles.buttonTextBig]}>Open</Text>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop style={styles.backdrop} />
          <Dialog.Viewport style={styles.viewport}>
            <Dialog.Content style={styles.content}>
              <Dialog.Title style={styles.title}>closeOnBack</Dialog.Title>
              <Dialog.Description style={styles.description}>
                The hardware Back press (Escape here) closes this dialog instead of leaving.
              </Dialog.Description>
              <View style={styles.actions}>
                <Dialog.Close style={styles.button}>
                  <Text style={styles.buttonText}>Close</Text>
                </Dialog.Close>
              </View>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
      <Text style={styles.hint}>Back ◁ closes the Dialog</Text>
    </>
  ),
}
