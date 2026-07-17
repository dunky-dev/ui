import { describe, expect, it, vi } from 'vitest'
import { mergeProps } from '@dunky.dev/merge-props'

describe('mergeProps', () => {
  it('behavior values win over consumer values', () => {
    const merged = mergeProps({ id: 'consumer', title: 'kept' }, { id: 'behavior' })
    expect(merged).toEqual({ id: 'behavior', title: 'kept' })
  })

  it('chains handlers — consumer first, then behavior', () => {
    const order: string[] = []
    const merged = mergeProps(
      { onClick: () => order.push('consumer') },
      { onClick: () => order.push('behavior') },
    )
    ;(merged.onClick as () => void)()
    expect(order).toEqual(['consumer', 'behavior'])
  })

  it('forwards arguments to both handlers', () => {
    const consumer = vi.fn()
    const behavior = vi.fn()
    const merged = mergeProps({ onChange: consumer }, { onChange: behavior })
    ;(merged.onChange as (value: string) => void)('x')
    expect(consumer).toHaveBeenCalledWith('x')
    expect(behavior).toHaveBeenCalledWith('x')
  })
})
