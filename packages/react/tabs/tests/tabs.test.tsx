// @vitest-environment jsdom
// The React edge of the Tabs — behavior only; the machine's own contract is
// covered in @dunky.dev/tabs's tests.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tabs, type TabsProps } from '@dunky.dev/react-tabs'

const DefaultTabs = (props: TabsProps) => (
  <Tabs defaultValue='one' {...props}>
    <Tabs.List aria-label='Sections'>
      <Tabs.Trigger value='one'>One</Tabs.Trigger>
      <Tabs.Trigger value='two'>Two</Tabs.Trigger>
      <Tabs.Trigger value='three'>Three</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value='one'>Panel one</Tabs.Content>
    <Tabs.Content value='two'>Panel two</Tabs.Content>
    <Tabs.Content value='three'>Panel three</Tabs.Content>
  </Tabs>
)

const DisabledTabs = ({ disabled = true, ...props }: TabsProps & { disabled?: boolean }) => (
  <Tabs defaultValue='one' {...props}>
    <Tabs.List aria-label='Sections'>
      <Tabs.Trigger value='one'>One</Tabs.Trigger>
      <Tabs.Trigger value='two' disabled={disabled}>
        Two
      </Tabs.Trigger>
      <Tabs.Trigger value='three'>Three</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value='one'>Panel one</Tabs.Content>
    <Tabs.Content value='two'>Panel two</Tabs.Content>
    <Tabs.Content value='three'>Panel three</Tabs.Content>
  </Tabs>
)

const tab = (name: string): HTMLElement => screen.getByRole('tab', { name })
const focusTab = (name: string): void => {
  act(() => tab(name).focus())
}
const pressKey = (name: string, key: string): void => {
  fireEvent.keyDown(tab(name), { key })
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Tabs', () => {
  describe('aria wiring', () => {
    it('wires the tablist, tabs, and panels together', () => {
      render(<DefaultTabs />)
      const list = screen.getByRole('tablist', { name: 'Sections' })
      expect(list.getAttribute('aria-orientation')).toBe('horizontal')

      expect(tab('One').getAttribute('aria-selected')).toBe('true')
      expect(tab('Two').getAttribute('aria-selected')).toBe('false')

      const panel = screen.getByRole('tabpanel')
      expect(tab('One').getAttribute('aria-controls')).toBe(panel.id)
      expect(panel.getAttribute('aria-labelledby')).toBe(tab('One').id)
      expect(panel.tabIndex).toBe(0)
    })

    it('shows only the selected panel', () => {
      render(<DefaultTabs />)
      expect(screen.getByText('Panel one').hidden).toBe(false)
      expect(screen.getByText('Panel two').hidden).toBe(true)
      expect(screen.getByText('Panel three').hidden).toBe(true)
    })

    it('exposes data-state and data-orientation for styling', () => {
      render(<DefaultTabs />)
      expect(screen.getByRole('tablist').getAttribute('data-orientation')).toBe('horizontal')
      expect(tab('One').getAttribute('data-state')).toBe('active')
      expect(tab('Two').getAttribute('data-state')).toBe('inactive')
      expect(screen.getByText('Panel one').getAttribute('data-state')).toBe('active')
    })

    it('makes the selected tab the only tabbable one', () => {
      render(<DefaultTabs defaultValue='two' />)
      expect(tab('Two').tabIndex).toBe(0)
      expect(tab('One').tabIndex).toBe(-1)
      expect(tab('Three').tabIndex).toBe(-1)
    })

    it('keeps the list reachable when nothing is selected', () => {
      render(<DefaultTabs defaultValue={undefined} />)
      expect(tab('One').tabIndex).toBe(0)
      expect(screen.getByText('Panel one').hidden).toBe(true)
    })
  })

  describe('pointer', () => {
    it('selects a tab on press and swaps the panels', () => {
      render(<DefaultTabs />)
      act(() => tab('Two').click())
      expect(tab('Two').getAttribute('aria-selected')).toBe('true')
      expect(screen.getByText('Panel two').hidden).toBe(false)
      expect(screen.getByText('Panel one').hidden).toBe(true)
    })

    it('reports the selection through onValueChange', () => {
      const onValueChange = vi.fn()
      render(<DefaultTabs onValueChange={onValueChange} />)
      act(() => tab('Two').click())
      expect(onValueChange).toHaveBeenLastCalledWith('two')
    })

    it('does not select a disabled tab', () => {
      render(<DisabledTabs />)
      act(() => tab('Two').click())
      expect(tab('One').getAttribute('aria-selected')).toBe('true')
      expect(tab('Two').getAttribute('aria-selected')).toBe('false')
    })
  })

  describe('keyboard — automatic activation', () => {
    it('moves focus and selects the next tab on ArrowRight', () => {
      render(<DefaultTabs />)
      focusTab('One')
      pressKey('One', 'ArrowRight')
      expect(document.activeElement).toBe(tab('Two'))
      expect(tab('Two').getAttribute('aria-selected')).toBe('true')
    })

    it('skips a disabled tab', () => {
      render(<DisabledTabs />)
      focusTab('One')
      pressKey('One', 'ArrowRight')
      expect(document.activeElement).toBe(tab('Three'))
    })

    it('starts skipping a tab when its disabled prop flips after mount', () => {
      const { rerender } = render(<DisabledTabs disabled={false} />)
      rerender(<DisabledTabs />)
      focusTab('One')
      pressKey('One', 'ArrowRight')
      expect(document.activeElement).toBe(tab('Three'))
    })

    it('navigates with ArrowDown/ArrowUp when vertical', () => {
      render(<DefaultTabs orientation='vertical' />)
      expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical')
      focusTab('One')
      pressKey('One', 'ArrowDown')
      expect(document.activeElement).toBe(tab('Two'))
      pressKey('Two', 'ArrowUp')
      expect(document.activeElement).toBe(tab('One'))
    })
  })

  describe('keyboard — manual activation', () => {
    it('moves focus without selecting', () => {
      render(<DefaultTabs activationMode='manual' />)
      focusTab('One')
      pressKey('One', 'ArrowRight')
      expect(document.activeElement).toBe(tab('Two'))
      expect(tab('One').getAttribute('aria-selected')).toBe('true')
      expect(tab('Two').getAttribute('aria-selected')).toBe('false')
    })

    it('selects the focused tab on Enter', () => {
      render(<DefaultTabs activationMode='manual' />)
      focusTab('One')
      pressKey('One', 'ArrowRight')
      pressKey('Two', 'Enter')
      expect(tab('Two').getAttribute('aria-selected')).toBe('true')
    })

    it('selects the focused tab on Space', () => {
      render(<DefaultTabs activationMode='manual' />)
      focusTab('One')
      pressKey('One', 'ArrowRight')
      pressKey('Two', ' ')
      expect(tab('Two').getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('controlled value', () => {
    it('follows the value prop in both directions', () => {
      const { rerender } = render(<DefaultTabs value='one' />)
      expect(tab('One').getAttribute('aria-selected')).toBe('true')

      rerender(<DefaultTabs value='two' />)
      expect(tab('Two').getAttribute('aria-selected')).toBe('true')

      rerender(<DefaultTabs value='one' />)
      expect(tab('One').getAttribute('aria-selected')).toBe('true')
    })

    it('reports internal selection intent through onValueChange', () => {
      const onValueChange = vi.fn()
      render(<DefaultTabs value='one' onValueChange={onValueChange} />)
      act(() => tab('Two').click())
      expect(onValueChange).toHaveBeenLastCalledWith('two')
    })
  })
})
