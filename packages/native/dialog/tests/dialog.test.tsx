// The React Native edge of the Dialog — behavior + the real RN prop
// translation; the machine's own contract is covered in @dunky.dev/dialog's
// tests. Renders through jest-expo + react-native (RNTL), so it asserts the
// actual native props a device consumes (accessibilityViewIsModal, box-none,
// onPress), not a web translation.
import { useState } from 'react'
import { Modal, Pressable, Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Dialog, type DialogProps } from '@dunky.dev/native-dialog'

const DefaultDialog = (props: DialogProps) => (
  <Dialog {...props}>
    <Dialog.Trigger testID='trigger'>
      <Text>Trigger</Text>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop testID='backdrop' />
      <Dialog.Viewport testID='viewport'>
        <Dialog.Content testID='content'>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close testID='close'>
            <Text>Close</Text>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
)

const isOpen = () => screen.queryByTestId('content') !== null
const press = (testID: string) => fireEvent.press(screen.getByTestId(testID))
// The hardware Back / Android gesture arrives as the Modal's onRequestClose.
const pressHardwareBack = () => fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose')

describe('open and close wiring', () => {
  it('opens on Trigger press and closes on Close press', () => {
    render(<DefaultDialog />)
    expect(isOpen()).toBe(false)

    press('trigger')
    expect(isOpen()).toBe(true)

    press('close')
    expect(isOpen()).toBe(false)
  })

  it('a Backdrop press is the outside interaction and dismisses', () => {
    render(<DefaultDialog />)
    press('trigger')

    press('backdrop')
    expect(isOpen()).toBe(false)
  })

  it('an outside-press veto keeps the dialog open', () => {
    render(<DefaultDialog onInteractOutside={event => event?.preventDefault?.()} />)
    press('trigger')

    // A real RN press event is cancelable; fireEvent's default is bare, so
    // pass one so the consumer's preventDefault has something to flip.
    const event = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    }
    fireEvent.press(screen.getByTestId('backdrop'), event)
    expect(isOpen()).toBe(true)
  })

  it('reports each actual change through onOpenChange', () => {
    const changes: boolean[] = []
    render(<DefaultDialog onOpenChange={open => changes.push(open)} />)

    press('trigger')
    press('close')
    expect(changes).toEqual([true, false])
  })
})

describe('hardware back', () => {
  it('dismisses by default (Back is this host’s Escape)', () => {
    render(<DefaultDialog />)
    press('trigger')

    pressHardwareBack()
    expect(isOpen()).toBe(false)
  })

  it('closeOnBack={false} opts out', () => {
    render(<DefaultDialog closeOnBack={false} />)
    press('trigger')

    pressHardwareBack()
    expect(isOpen()).toBe(true)
  })

  it('onBackNavigation can veto the dismissal', () => {
    render(<DefaultDialog onBackNavigation={event => event?.preventDefault?.()} />)
    press('trigger')

    pressHardwareBack()
    expect(isOpen()).toBe(true)
  })
})

describe('controlled', () => {
  // Drive `open` from real state — the consumer's actual usage.
  const Controlled = () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Pressable testID='ext-open' onPress={() => setOpen(true)}>
          <Text>ext open</Text>
        </Pressable>
        <Pressable testID='ext-close' onPress={() => setOpen(false)}>
          <Text>ext close</Text>
        </Pressable>
        <DefaultDialog open={open} />
      </>
    )
  }

  it('follows the open prop and never closes on its own', () => {
    render(<Controlled />)
    expect(isOpen()).toBe(false)

    press('ext-open')
    expect(isOpen()).toBe(true)

    // A Close press only records the intent; the prop still says open.
    press('close')
    expect(isOpen()).toBe(true)

    // The prop going false is what actually closes it.
    press('ext-close')
    expect(isOpen()).toBe(false)
  })
})

describe('native prop translation', () => {
  it('marks Content as a modal view for assistive tech', () => {
    render(<DefaultDialog />)
    press('trigger')

    expect(screen.getByTestId('content').props.accessibilityViewIsModal).toBe(true)
  })

  it("lets the Viewport's empty area fall through to the Backdrop", () => {
    render(<DefaultDialog />)
    press('trigger')

    expect(screen.getByTestId('viewport').props.pointerEvents).toBe('box-none')
  })

  it('labels Content from the rendered Title', () => {
    render(<DefaultDialog />)
    press('trigger')

    expect(screen.getByTestId('content').props.accessibilityLabelledBy).toBeTruthy()
  })

  it('drops the label reference when no titling part is rendered', () => {
    render(
      <Dialog defaultOpen>
        <Dialog.Portal>
          <Dialog.Content testID='content' />
        </Dialog.Portal>
      </Dialog>,
    )

    expect(screen.getByTestId('content').props.accessibilityLabelledBy).toBeUndefined()
  })
})

describe('exit window', () => {
  it('an animated dialog closes without hanging in the exit state', () => {
    render(<DefaultDialog animated />)
    press('trigger')

    press('close')
    expect(isOpen()).toBe(false)
  })
})
