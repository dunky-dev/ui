// @vitest-environment jsdom
// The React Native edge of the Dialog — behavior only; the machine's own
// contract is covered in @dunky.dev/dialog's tests. Renders through
// react-native-web (the root vitest config aliases react-native), so the
// hardware-back path is exercised via RNW's Modal, which maps Escape to
// `onRequestClose`.
import { useState } from 'react'
import { Text } from 'react-native'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

const press = (testID: string): void => {
  act(() => {
    fireEvent.click(screen.getByTestId(testID))
  })
}

const pressHardwareBack = (): void => {
  // RNW's Modal listens for Escape and reports it as `onRequestClose` — the
  // web stand-in for Android's hardware back.
  act(() => {
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.keyUp(document, { key: 'Escape' })
  })
}

const isOpen = (): boolean => screen.queryByTestId('content') !== null

afterEach(cleanup)

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

    press('backdrop')
    expect(isOpen()).toBe(true)
  })

  it('reports each actual change through onOpenChange', () => {
    const onOpenChange = vi.fn()
    render(<DefaultDialog onOpenChange={onOpenChange} />)

    press('trigger')
    press('close')
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })
})

describe('hardware back', () => {
  it('does not dismiss by default (closeOnBack is off)', () => {
    render(<DefaultDialog />)
    press('trigger')

    pressHardwareBack()
    expect(isOpen()).toBe(true)
  })

  it('dismisses with closeOnBack', () => {
    render(<DefaultDialog closeOnBack />)
    press('trigger')

    pressHardwareBack()
    expect(isOpen()).toBe(false)
  })

  it('onBackNavigation can veto the dismissal', () => {
    render(<DefaultDialog closeOnBack onBackNavigation={event => event?.preventDefault?.()} />)
    press('trigger')

    pressHardwareBack()
    expect(isOpen()).toBe(true)
  })
})

describe('controlled', () => {
  const Controlled = (props: DialogProps) => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Text testID='outside-open' onPress={() => setOpen(true)}>
          outside open
        </Text>
        <Text testID='outside-close' onPress={() => setOpen(false)}>
          outside close
        </Text>
        <DefaultDialog {...props} open={open} />
      </>
    )
  }

  it('follows the open prop', () => {
    render(<Controlled />)
    expect(isOpen()).toBe(false)

    press('outside-open')
    expect(isOpen()).toBe(true)

    press('outside-close')
    expect(isOpen()).toBe(false)
  })

  it('never closes on its own — a Close press only records the intent', () => {
    render(<Controlled />)
    press('outside-open')

    press('close')
    expect(isOpen()).toBe(true)
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

describe('accessibility wiring', () => {
  // Native has no described-by: normalize folds the description reference
  // into the label reference (accessibilityLabelledBy), so only that is
  // asserted here.
  it('labels the content from the rendered Title', () => {
    render(<DefaultDialog />)
    press('trigger')

    expect(screen.getByTestId('content').getAttribute('aria-labelledby')).toBeTruthy()
  })

  it('drops the label reference when no part is rendered', () => {
    render(
      <Dialog defaultOpen>
        <Dialog.Portal>
          <Dialog.Content testID='content' />
        </Dialog.Portal>
      </Dialog>,
    )

    expect(screen.getByTestId('content').getAttribute('aria-labelledby')).toBeNull()
  })
})
