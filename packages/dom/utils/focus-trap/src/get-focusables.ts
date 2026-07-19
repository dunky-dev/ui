// Selector-based on purpose: visibility probing via offsetParent is always
// null in jsdom, and the trapped subtree is visible whenever the trap runs.
export const FOCUSABLE_SELECTOR: string = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ')

/**
 * Marks an element as the cycle's final stop, wherever it renders — sorted
 * after everything else, in DOM order among themselves. A plain data
 * contract: whoever renders the element sets the attribute; the trap honors it.
 */
export const FOCUS_LAST_ATTRIBUTE: string = 'data-focus-last'

/** The container's focusables in cycle order: DOM order, marked-last at the end. */
export function getFocusables(container: HTMLElement): HTMLElement[] {
  const candidates = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const focusables: HTMLElement[] = []
  const last: HTMLElement[] = []
  for (const element of Array.from(candidates)) {
    if (element.tabIndex < 0) continue
    if (element.hasAttribute(FOCUS_LAST_ATTRIBUTE)) last.push(element)
    else focusables.push(element)
  }
  for (const element of last) focusables.push(element)
  return focusables
}
