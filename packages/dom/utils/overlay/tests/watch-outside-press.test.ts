// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerLayer, watchOutsidePress } from '@dunky.dev/dom-overlay'

const registered: Array<() => void> = []

const mountLayer = (id: string, depth: number): HTMLElement => {
  const element = document.createElement('div')
  document.body.append(element)
  registered.push(registerLayer({ id, depth, element, modal: false, backdrop: () => null }))
  return element
}

const click = (target: Element): void => {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

afterEach(() => {
  for (const undo of registered) undo()
  registered.length = 0
  document.body.innerHTML = ''
})

describe('watchOutsidePress', () => {
  const setup = (
    startedInside: () => boolean = () => false,
  ): {
    element: HTMLElement
    trigger: HTMLElement
    outside: HTMLElement
    onOutsidePress: () => void
  } => {
    const element = mountLayer('layer', 1)
    const trigger = document.createElement('button')
    const outside = document.createElement('button')
    document.body.append(trigger, outside)
    const onOutsidePress = vi.fn()
    registered.push(watchOutsidePress('layer', { element, trigger, startedInside, onOutsidePress }))
    return { element, trigger, outside, onOutsidePress }
  }

  it('fires for a press outside the layer and the trigger', () => {
    const { outside, onOutsidePress } = setup()

    click(outside)

    expect(onOutsidePress).toHaveBeenCalledTimes(1)
  })

  it('ignores a press inside the layer', () => {
    const { element, onOutsidePress } = setup()

    click(element)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })

  it('ignores a press on the trigger — its own press stays a plain toggle', () => {
    const { trigger, onOutsidePress } = setup()

    click(trigger)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })

  it('ignores a press once this layer is no longer topmost', () => {
    const { outside, onOutsidePress } = setup()
    mountLayer('above', 2)

    click(outside)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })

  it('ignores a press whose gesture started inside the layer', () => {
    const { outside, onOutsidePress } = setup(() => true)

    click(outside)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })

  it('stops watching once disposed', () => {
    const element = mountLayer('layer', 1)
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOutsidePress = vi.fn()

    const dispose = watchOutsidePress('layer', {
      element,
      trigger: null,
      startedInside: () => false,
      onOutsidePress,
    })
    dispose()
    click(outside)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })
})
