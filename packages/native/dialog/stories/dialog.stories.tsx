import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite'
import { Dialog } from '@dunky.dev/native-dialog'

const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
}

export default meta
type StoryType = StoryObj<typeof Dialog>

// The primitive ships headless — the story is the consumer, so it brings the
// styles.
const styles = StyleSheet.create({
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
    width: '100%',
    alignSelf: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  title: { fontSize: 17, fontWeight: '600', color: '#1c1e26' },
  description: { marginTop: 8, fontSize: 15, color: '#5b6172' },
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
  buttonPrimary: { backgroundColor: '#3142c4' },
  buttonText: { fontSize: 15, color: '#1c1e26' },
  buttonTextPrimary: { color: 'white' },
})

export const Default: StoryType = {
  render: () => (
    <Dialog>
      <Dialog.Trigger style={styles.button}>
        <Text style={styles.buttonText}>Delete...</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={styles.backdrop} />
        <Dialog.Viewport style={styles.viewport}>
          <Dialog.Content style={styles.content}>
            <Dialog.Title style={styles.title}>Delete file?</Dialog.Title>
            <Dialog.Description style={styles.description}>
              This cannot be undone.
            </Dialog.Description>
            <View style={styles.actions}>
              <Dialog.Close style={styles.button}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Dialog.Close>
              <Pressable style={[styles.button, styles.buttonPrimary]}>
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Delete</Text>
              </Pressable>
            </View>
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
      <View style={{ gap: 8 }}>
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
      </View>
    )
  },
}

export const CloseOnBack: StoryType = {
  render: () => (
    <Dialog closeOnBack>
      <Dialog.Trigger style={styles.button}>
        <Text style={styles.buttonText}>Open (Back closes)</Text>
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
  ),
}
