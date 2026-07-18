// @vitest-environment jsdom
// The React edge of the Menu — behavior only; the machine's own contract is
// covered in @dunky.dev/menu's tests.
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Menu, type MenuProps } from '@dunky.dev/react-menu'

// Two enabled c-items (Copy, Cut) exercise typeahead cycling; Duplicate is the
// disabled item every navigation must skip.
const DefaultMenu = ({ onRename, ...props }: MenuProps & { onRename?: () => void }) => (
  <Menu {...props}>
    <Menu.Trigger>Actions</Menu.Trigger>
    <Menu.Portal>
      <Menu.Content data-testid='content'>
        <Menu.Item value='rename' onSelect={onRename}>
          Rename
        </Menu.Item>
        <Menu.Item value='duplicate' disabled>
          Duplicate
        </Menu.Item>
        <Menu.Item value='copy'>Copy</Menu.Item>
        <Menu.Item value='cut'>Cut</Menu.Item>
        <Menu.Separator data-testid='separator' />
        <Menu.Group data-testid='group'>
          <Menu.GroupLabel>Danger</Menu.GroupLabel>
          <Menu.Item value='delete'>Delete</Menu.Item>
        </Menu.Group>
      </Menu.Content>
    </Menu.Portal>
  </Menu>
)

const trigger = (): HTMLElement => screen.getByText('Actions')
const content = (): HTMLElement => screen.getByTestId('content')
const openMenu = (): void => {
  act(() => trigger().click())
}
const pressEscape = (): void => {
  fireEvent.keyDown(document.body, { key: 'Escape' })
}
const highlightOf = (): string | null => content().getAttribute('aria-activedescendant')

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Menu', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes back on a second press', () => {
      render(<DefaultMenu />)
      expect(screen.queryByRole('menu')).toBeNull()

      openMenu()
      expect(screen.queryByRole('menu')).not.toBeNull()

      openMenu()
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('renders open when defaultOpen', () => {
      render(<DefaultMenu defaultOpen />)
      expect(screen.queryByRole('menu')).not.toBeNull()
    })

    it('fires onOpenChange with the new value on open and close', () => {
      const onOpenChange = vi.fn()
      render(<DefaultMenu onOpenChange={onOpenChange} />)

      openMenu()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      act(pressEscape)
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('keyboard', () => {
    it('opens on trigger Enter with the first enabled item highlighted, focusing the content', () => {
      render(<DefaultMenu />)
      fireEvent.keyDown(trigger(), { key: 'Enter' })

      expect(document.activeElement).toBe(content())
      expect(highlightOf()).toBe(screen.getByText('Rename').id)
      expect(screen.getByText('Rename').hasAttribute('data-highlighted')).toBe(true)
    })

    it('opens on trigger ArrowUp with the last enabled item highlighted', () => {
      render(<DefaultMenu />)
      fireEvent.keyDown(trigger(), { key: 'ArrowUp' })
      expect(highlightOf()).toBe(screen.getByText('Delete').id)
    })

    it('moves the highlight with the arrows, skipping disabled items and wrapping', () => {
      render(<DefaultMenu />)
      fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
      expect(highlightOf()).toBe(screen.getByText('Rename').id)

      fireEvent.keyDown(content(), { key: 'ArrowDown' }) // skips disabled Duplicate
      expect(highlightOf()).toBe(screen.getByText('Copy').id)

      fireEvent.keyDown(content(), { key: 'ArrowUp' })
      fireEvent.keyDown(content(), { key: 'ArrowUp' }) // wraps to the end
      expect(highlightOf()).toBe(screen.getByText('Delete').id)
    })

    it('jumps to the ends with Home and End', () => {
      render(<DefaultMenu defaultOpen />)
      fireEvent.keyDown(content(), { key: 'End' })
      expect(highlightOf()).toBe(screen.getByText('Delete').id)

      fireEvent.keyDown(content(), { key: 'Home' })
      expect(highlightOf()).toBe(screen.getByText('Rename').id)
    })

    it('typeahead jumps over a disabled match', () => {
      render(<DefaultMenu defaultOpen />)
      fireEvent.keyDown(content(), { key: 'd' }) // Duplicate is disabled -> Delete
      expect(highlightOf()).toBe(screen.getByText('Delete').id)
    })

    it('typeahead cycles on a repeated character', () => {
      render(<DefaultMenu defaultOpen />)
      fireEvent.keyDown(content(), { key: 'c' })
      expect(highlightOf()).toBe(screen.getByText('Copy').id)
      fireEvent.keyDown(content(), { key: 'c' })
      expect(highlightOf()).toBe(screen.getByText('Cut').id)
    })

    it('keeps document order in navigation after an item prop flips at runtime', () => {
      const Flipping = ({ bDisabled }: { bDisabled: boolean }) => (
        <Menu defaultOpen>
          <Menu.Portal>
            <Menu.Content data-testid='content'>
              <Menu.Item value='a'>Alpha</Menu.Item>
              <Menu.Item value='b' disabled={bDisabled}>
                Beta
              </Menu.Item>
              <Menu.Item value='c'>Gamma</Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu>
      )
      const { rerender } = render(<Flipping bDisabled />)
      rerender(<Flipping bDisabled={false} />)

      fireEvent.keyDown(content(), { key: 'ArrowDown' })
      expect(highlightOf()).toBe(screen.getByText('Alpha').id)
      fireEvent.keyDown(content(), { key: 'ArrowDown' }) // b kept its place
      expect(highlightOf()).toBe(screen.getByText('Beta').id)
    })

    it('typeahead reads the textValue prop over the rendered text', () => {
      render(
        <Menu defaultOpen>
          <Menu.Portal>
            <Menu.Content data-testid='content'>
              <Menu.Item value='archive' textValue='Zip'>
                <em>Archive</em>
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu>,
      )
      fireEvent.keyDown(content(), { key: 'z' })
      expect(highlightOf()).toBe(screen.getByRole('menuitem').id)
    })

    it('Enter activates the highlighted item: onSelect fires, the menu closes, focus returns', () => {
      const onRename = vi.fn()
      render(<DefaultMenu onRename={onRename} />)
      act(() => trigger().focus())
      fireEvent.keyDown(trigger(), { key: 'Enter' })

      fireEvent.keyDown(content(), { key: 'Enter' })
      expect(onRename).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menu')).toBeNull()
      expect(document.activeElement).toBe(trigger())
    })

    it('Escape closes and returns focus to the trigger', () => {
      render(<DefaultMenu />)
      act(() => trigger().focus())
      openMenu()

      act(pressEscape)
      expect(screen.queryByRole('menu')).toBeNull()
      expect(document.activeElement).toBe(trigger())
    })

    it('stays open when onEscapeKeyDown prevents default', () => {
      const onEscapeKeyDown = vi.fn(event => event.preventDefault())
      render(<DefaultMenu defaultOpen onEscapeKeyDown={onEscapeKeyDown} />)
      act(pressEscape)
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menu')).not.toBeNull()
    })

    it('Tab closes the menu', () => {
      render(<DefaultMenu defaultOpen />)
      fireEvent.keyDown(content(), { key: 'Tab' })
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })

  describe('pointer', () => {
    it('highlights an item on hover and clears on leave', () => {
      render(<DefaultMenu defaultOpen />)
      const item = screen.getByText('Copy')

      fireEvent.pointerOver(item)
      expect(highlightOf()).toBe(item.id)
      expect(item.hasAttribute('data-highlighted')).toBe(true)

      fireEvent.pointerOut(item)
      expect(highlightOf()).toBeNull()
    })

    it('activates on item press: onSelect fires, then the menu closes', () => {
      const onRename = vi.fn()
      render(<DefaultMenu defaultOpen onRename={onRename} />)
      act(() => screen.getByText('Rename').click())
      expect(onRename).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('a disabled item neither highlights nor activates', () => {
      render(<DefaultMenu defaultOpen />)
      const item = screen.getByText('Duplicate')

      fireEvent.pointerOver(item)
      expect(highlightOf()).toBeNull()

      act(() => item.click())
      expect(screen.queryByRole('menu')).not.toBeNull()
    })
  })

  describe('outside interaction', () => {
    it('closes on a press outside the content', () => {
      render(<DefaultMenu defaultOpen />)
      fireEvent.pointerDown(document.body)
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('closes when focus lands outside the content', () => {
      render(
        <>
          <button data-testid='outside'>outside</button>
          <DefaultMenu defaultOpen />
        </>,
      )
      fireEvent.focusIn(screen.getByTestId('outside'))
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('stays open when onInteractOutside prevents default', () => {
      const onInteractOutside = vi.fn(event => event?.preventDefault())
      render(<DefaultMenu defaultOpen onInteractOutside={onInteractOutside} />)
      fireEvent.pointerDown(document.body)
      expect(onInteractOutside).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menu')).not.toBeNull()
    })

    it('a press on the trigger is not an outside interaction — it toggles instead', () => {
      render(<DefaultMenu defaultOpen />)
      fireEvent.pointerDown(trigger())
      expect(screen.queryByRole('menu')).not.toBeNull()

      act(() => trigger().click())
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultMenu open={false} />)
      expect(screen.queryByRole('menu')).toBeNull()

      rerender(<DefaultMenu open />)
      expect(screen.queryByRole('menu')).not.toBeNull()

      rerender(<DefaultMenu open={false} />)
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('reports a dismissal intent but stays open until the prop closes it', () => {
      const onOpenChange = vi.fn()
      render(<DefaultMenu open onOpenChange={onOpenChange} />)
      act(pressEscape)
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      // The consumer didn't update `open` — that's the veto.
      expect(screen.queryByRole('menu')).not.toBeNull()
    })

    it('reports a trigger press without opening until the prop does', () => {
      const onOpenChange = vi.fn()
      render(<DefaultMenu open={false} onOpenChange={onOpenChange} />)
      openMenu()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the popup relationship', () => {
      render(<DefaultMenu />)
      expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().hasAttribute('aria-controls')).toBe(false)

      openMenu()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(trigger().getAttribute('aria-controls')).toBe(screen.getByRole('menu').id)
    })

    it('content is a vertical menu labelled by the trigger, focusable in script only', () => {
      render(<DefaultMenu defaultOpen />)
      const menu = screen.getByRole('menu')
      expect(menu.getAttribute('aria-labelledby')).toBe(trigger().id)
      expect(menu.getAttribute('aria-orientation')).toBe('vertical')
      expect(menu.tabIndex).toBe(-1)
    })

    it('items are menuitems; a disabled one is perceivable through aria-disabled', () => {
      render(<DefaultMenu defaultOpen />)
      expect(screen.getAllByRole('menuitem')).toHaveLength(5)

      const disabled = screen.getByText('Duplicate')
      expect(disabled.getAttribute('aria-disabled')).toBe('true')
      expect(disabled.hasAttribute('data-disabled')).toBe(true)
      expect(screen.getByText('Rename').hasAttribute('aria-disabled')).toBe(false)
    })

    it('the group is labelled by its rendered label; the reference follows removal', () => {
      const WithLabel = ({ labelled }: { labelled: boolean }) => (
        <Menu defaultOpen>
          <Menu.Portal>
            <Menu.Content>
              <Menu.Group data-testid='group'>
                {labelled && <Menu.GroupLabel>Danger</Menu.GroupLabel>}
                <Menu.Item value='delete'>Delete</Menu.Item>
              </Menu.Group>
            </Menu.Content>
          </Menu.Portal>
        </Menu>
      )
      const { rerender } = render(<WithLabel labelled />)
      const group = screen.getByTestId('group')
      expect(group.getAttribute('role')).toBe('group')
      expect(group.getAttribute('aria-labelledby')).toBe(screen.getByText('Danger').id)

      rerender(<WithLabel labelled={false} />)
      expect(group.hasAttribute('aria-labelledby')).toBe(false)
    })

    it('the separator carries the separator role', () => {
      render(<DefaultMenu defaultOpen />)
      expect(screen.getByTestId('separator').getAttribute('role')).toBe('separator')
    })

    it('trigger and content expose data-state for styling', () => {
      render(<DefaultMenu />)
      expect(trigger().getAttribute('data-state')).toBe('closed')

      openMenu()
      expect(trigger().getAttribute('data-state')).toBe('open')
      expect(content().getAttribute('data-state')).toBe('open')
    })
  })

  describe('strict mode', () => {
    it('item registration and selection delivery stay idempotent', () => {
      const onRename = vi.fn()
      render(
        <StrictMode>
          <DefaultMenu defaultOpen onRename={onRename} />
        </StrictMode>,
      )
      // A doubled registry would break the c -> c cycle (Copy, Cut, Copy...).
      fireEvent.keyDown(content(), { key: 'c' })
      fireEvent.keyDown(content(), { key: 'c' })
      expect(highlightOf()).toBe(screen.getByText('Cut').id)

      fireEvent.keyDown(content(), { key: 'Enter' })
      expect(onRename).not.toHaveBeenCalled()

      act(() => trigger().click())
      act(() => screen.getByText('Rename').click())
      expect(onRename).toHaveBeenCalledTimes(1)
    })
  })
})
