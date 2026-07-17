import { describe, expect, it, vi } from 'vitest'
import { toDomProps, type PressPayload } from '@dunky.dev/dom-bindings'

describe('toDomProps', () => {
  it('translates the logical vocabulary into DOM attribute names', () => {
    expect(
      toDomProps({
        id: 'x',
        role: 'dialog',
        modal: true,
        hasPopup: 'dialog',
        expanded: true,
        controls: 'c',
        labelledBy: 't',
        describedBy: 'd',
        disabled: true,
        'data-state': 'open',
      }),
    ).toEqual({
      id: 'x',
      role: 'dialog',
      'aria-modal': true,
      'aria-haspopup': 'dialog',
      'aria-expanded': true,
      'aria-controls': 'c',
      'aria-labelledby': 't',
      'aria-describedby': 'd',
      disabled: true,
      'data-state': 'open',
    })
  })

  it('omits keys the part does not carry', () => {
    expect(toDomProps({})).toEqual({})
  })

  it('marks focusable: false as out of the tab order', () => {
    expect(toDomProps({ focusable: false })).toEqual({ tabIndex: -1 })
    expect(toDomProps({ focusable: true })).toEqual({})
  })

  it('wires onPress as onClick, passing the event through', () => {
    const onPress = vi.fn()
    const { onClick } = toDomProps({ onPress }) as {
      onClick: (event: PressPayload) => void
    }

    const event: PressPayload = { defaultPrevented: false, preventDefault: () => {} }
    onClick(event)
    expect(onPress).toHaveBeenCalledWith(event)
  })
})
