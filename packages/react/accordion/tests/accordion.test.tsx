// @vitest-environment jsdom
// The React edge of the accordion — behavior only; the machine's own contract
// is covered in @dunky.dev/accordion's tests.
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Accordion, type AccordionProps } from '@dunky.dev/react-accordion'

type FixtureProps = AccordionProps & { disabledItems?: string[]; items?: string[] }

const DefaultAccordion = ({
  disabledItems = [],
  items = ['a', 'b', 'c'],
  ...props
}: FixtureProps) => (
  <Accordion {...(props as AccordionProps)}>
    {items.map(value => (
      <Accordion.Item
        key={value}
        value={value}
        disabled={disabledItems.includes(value)}
        data-testid={`item-${value}`}
      >
        <Accordion.Header>
          <Accordion.Trigger>Trigger {value}</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Content {value}</Accordion.Content>
      </Accordion.Item>
    ))}
  </Accordion>
)

const trigger = (value: string): HTMLElement =>
  screen.getByRole('button', { name: `Trigger ${value}` })
const content = (value: string): HTMLElement => screen.getByText(`Content ${value}`)
const press = (value: string): void => act(() => trigger(value).click())
const focusTrigger = (value: string): void => act(() => trigger(value).focus())
const pressKey = (value: string, key: string): void => {
  fireEvent.keyDown(trigger(value), { key })
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Accordion', () => {
  describe('open / close', () => {
    it('opens on trigger press', () => {
      render(<DefaultAccordion type='single' />)
      expect(trigger('a').getAttribute('aria-expanded')).toBe('false')

      press('a')
      expect(trigger('a').getAttribute('aria-expanded')).toBe('true')
    })

    it('single: pressing another trigger closes the open item', () => {
      render(<DefaultAccordion type='single' defaultValue='a' />)
      press('b')
      expect(trigger('a').getAttribute('aria-expanded')).toBe('false')
      expect(trigger('b').getAttribute('aria-expanded')).toBe('true')
    })

    it('single: re-press closes the open item when collapsible', () => {
      render(<DefaultAccordion type='single' collapsible defaultValue='a' />)
      press('a')
      expect(trigger('a').getAttribute('aria-expanded')).toBe('false')
    })

    it('multiple: items open independently', () => {
      render(<DefaultAccordion type='multiple' />)
      press('a')
      press('c')
      expect(trigger('a').getAttribute('aria-expanded')).toBe('true')
      expect(trigger('c').getAttribute('aria-expanded')).toBe('true')
    })
  })

  describe('keyboard navigation', () => {
    it('arrows move DOM focus across enabled triggers, skipping disabled and wrapping', () => {
      render(<DefaultAccordion type='single' disabledItems={['b']} />)
      focusTrigger('a')

      pressKey('a', 'ArrowDown')
      expect(document.activeElement).toBe(trigger('c'))

      pressKey('c', 'ArrowDown')
      expect(document.activeElement).toBe(trigger('a'))

      pressKey('a', 'ArrowUp')
      expect(document.activeElement).toBe(trigger('c'))
    })

    it('Home and End jump to the first and last triggers', () => {
      render(<DefaultAccordion type='single' />)
      focusTrigger('b')

      pressKey('b', 'End')
      expect(document.activeElement).toBe(trigger('c'))

      pressKey('c', 'Home')
      expect(document.activeElement).toBe(trigger('a'))
    })

    it('horizontal: ArrowRight moves focus; the cross-axis key is left alone', () => {
      render(<DefaultAccordion type='single' orientation='horizontal' />)
      focusTrigger('a')

      pressKey('a', 'ArrowDown')
      expect(document.activeElement).toBe(trigger('a'))

      pressKey('a', 'ArrowRight')
      expect(document.activeElement).toBe(trigger('b'))
    })

    it('an unmounted item unregisters and leaves the navigation order', () => {
      const { rerender } = render(<DefaultAccordion type='single' />)
      rerender(<DefaultAccordion type='single' items={['a', 'c']} />)
      focusTrigger('a')

      pressKey('a', 'ArrowDown')
      expect(document.activeElement).toBe(trigger('c'))
    })

    it('registers items once under StrictMode', () => {
      render(
        <StrictMode>
          <DefaultAccordion type='single' />
        </StrictMode>,
      )
      focusTrigger('a')

      pressKey('a', 'End')
      expect(document.activeElement).toBe(trigger('c'))
    })
  })

  describe('controlled', () => {
    it('single: follows the value prop in both directions', () => {
      const { rerender } = render(<DefaultAccordion type='single' value={null} />)
      expect(trigger('a').getAttribute('aria-expanded')).toBe('false')

      rerender(<DefaultAccordion type='single' value='a' />)
      expect(trigger('a').getAttribute('aria-expanded')).toBe('true')

      rerender(<DefaultAccordion type='single' value={null} />)
      expect(trigger('a').getAttribute('aria-expanded')).toBe('false')
    })

    it('multiple: follows the value array prop', () => {
      const { rerender } = render(<DefaultAccordion type='multiple' value={[]} />)
      rerender(<DefaultAccordion type='multiple' value={['a', 'b']} />)
      expect(trigger('a').getAttribute('aria-expanded')).toBe('true')
      expect(trigger('b').getAttribute('aria-expanded')).toBe('true')
    })

    it('a press the consumer declines leaves the prop authoritative', () => {
      render(<DefaultAccordion type='single' value='a' />)
      press('b')
      expect(trigger('a').getAttribute('aria-expanded')).toBe('true')
      expect(trigger('b').getAttribute('aria-expanded')).toBe('false')
    })

    it('reports presses through onValueChange in the mode shape', () => {
      const onValueChange = vi.fn()
      render(<DefaultAccordion type='single' collapsible onValueChange={onValueChange} />)

      press('b')
      expect(onValueChange).toHaveBeenLastCalledWith('b')

      press('b')
      expect(onValueChange).toHaveBeenLastCalledWith(null)
    })
  })

  describe('prop re-sync', () => {
    it('a disabled flip gates presses, and flipping back restores them', () => {
      const { rerender } = render(<DefaultAccordion type='single' />)

      rerender(<DefaultAccordion type='single' disabled />)
      press('a')
      expect(trigger('a').getAttribute('aria-expanded')).toBe('false')

      rerender(<DefaultAccordion type='single' />)
      press('a')
      expect(trigger('a').getAttribute('aria-expanded')).toBe('true')
    })

    it('an orientation flip moves the arrow axis', () => {
      const { rerender } = render(<DefaultAccordion type='single' />)
      rerender(<DefaultAccordion type='single' orientation='horizontal' />)
      focusTrigger('a')

      pressKey('a', 'ArrowRight')
      expect(document.activeElement).toBe(trigger('b'))
    })
  })

  describe('aria wiring', () => {
    it('trigger and content reference each other', () => {
      render(<DefaultAccordion type='single' defaultValue='a' />)
      const region = screen.getByRole('region')
      expect(region).toBe(content('a'))
      expect(trigger('a').getAttribute('aria-controls')).toBe(region.id)
      expect(region.getAttribute('aria-labelledby')).toBe(trigger('a').id)
    })

    it('content is natively hidden while closed', () => {
      render(<DefaultAccordion type='single' />)
      expect(content('a').hidden).toBe(true)

      press('a')
      expect(content('a').hidden).toBe(false)
    })

    it('disabled trigger is aria-disabled and ignores presses', () => {
      render(<DefaultAccordion type='single' disabledItems={['b']} />)
      expect(trigger('b').getAttribute('aria-disabled')).toBe('true')

      press('b')
      expect(trigger('b').getAttribute('aria-expanded')).toBe('false')
    })

    it('part ids derive from the id prop, generated when absent — even an explicit undefined', () => {
      render(<DefaultAccordion type='single' id='my-acc' />)
      expect(trigger('a').id).toBe('my-acc-trigger-a')
      cleanup()

      // `accordion` is the core's bare fallback: reaching it would mean the
      // explicit undefined knocked out the substrate's generated SSR-safe id.
      render(<DefaultAccordion type='single' id={undefined} />)
      expect(trigger('a').id).not.toBe('accordion-trigger-a')
    })

    it('parts carry the data attributes for styling', () => {
      render(<DefaultAccordion type='single' defaultValue='a' disabledItems={['b']} />)
      expect(screen.getByTestId('item-a').getAttribute('data-state')).toBe('open')
      expect(screen.getByTestId('item-b').getAttribute('data-state')).toBe('closed')
      expect(screen.getByTestId('item-b').getAttribute('data-disabled')).toBe('')
      expect(trigger('a').getAttribute('data-orientation')).toBe('vertical')
      expect(content('a').getAttribute('data-state')).toBe('open')
    })
  })
})
