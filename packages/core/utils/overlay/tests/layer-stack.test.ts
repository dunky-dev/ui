import { describe, expect, it } from 'vitest'
import { createLayerStack } from '@dunky.dev/overlay'

interface TestLayer {
  id: string
  depth: number
}

describe('createLayerStack', () => {
  it('deeper nesting wins regardless of registration order', () => {
    const stack = createLayerStack<TestLayer>()
    stack.register({ id: 'deep', depth: 2 })
    stack.register({ id: 'shallow', depth: 1 })

    expect(stack.isTopmost('deep')).toBe(true)
    expect(stack.isTopmost('shallow')).toBe(false)
    expect(stack.topmost()?.id).toBe('deep')
  })

  it('open order breaks ties between layers at the same depth', () => {
    const stack = createLayerStack<TestLayer>()
    stack.register({ id: 'first', depth: 1 })
    const unregisterSecond = stack.register({ id: 'second', depth: 1 })
    expect(stack.isTopmost('second')).toBe(true)

    unregisterSecond()
    expect(stack.isTopmost('first')).toBe(true)
  })

  it('has no topmost when empty', () => {
    const stack = createLayerStack<TestLayer>()
    expect(stack.topmost()).toBeUndefined()
    expect(stack.isTopmost('anything')).toBe(false)
  })

  it('stacks are independent — registering in one never affects another', () => {
    const a = createLayerStack<TestLayer>()
    const b = createLayerStack<TestLayer>()
    a.register({ id: 'x', depth: 1 })

    expect(a.isTopmost('x')).toBe(true)
    expect(b.topmost()).toBeUndefined()
  })
})
