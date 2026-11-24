import { flushSync } from 'svelte'

// Svelte batches updates into a microtask — every interaction flushes before
// the test reads the tree.
export const press = (element: HTMLElement): void => {
  element.click()
  flushSync()
}

export const keyDown = (target: EventTarget, init: KeyboardEventInit): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
  flushSync()
}

export const pressEscape = (): void => {
  keyDown(document.body, { key: 'Escape' })
}
