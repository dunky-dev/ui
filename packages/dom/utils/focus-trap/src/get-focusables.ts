// Selector-based on purpose: visibility probing via offsetParent is always
// null in jsdom, and the trapped subtree is visible whenever the trap runs.
const FOCUSABLE_SELECTOR = [
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

export function getFocusables(container: HTMLElement): HTMLElement[] {
  const candidates = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const focusables: HTMLElement[] = []
  for (const element of Array.from(candidates)) {
    if (element.tabIndex >= 0) focusables.push(element)
  }
  return focusables
}
