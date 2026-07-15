// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { create__Name__ } from '@dunky.dev/dom-__name__'

describe('create__Name__', () => {
  it('activates on click', () => {
    const onActivate = vi.fn()
    const button = document.createElement('button')
    document.body.append(button)
    const instance = create__Name__({ onActivate })
    instance.attach(button)
    button.click()
    expect(onActivate).toHaveBeenCalledTimes(1)
    instance.detach()
    button.remove()
  })

  it('does not activate while disabled', () => {
    const onActivate = vi.fn()
    const button = document.createElement('button')
    document.body.append(button)
    const instance = create__Name__({ onActivate, disabled: true })
    instance.attach(button)
    button.click()
    expect(onActivate).not.toHaveBeenCalled()
    instance.detach()
    button.remove()
  })
})
