export const FOCUSABLE_SELECTOR: string = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'audio[controls]',
  'video[controls]',
  'iframe',
  // Only a details' first summary is the disclosure widget browsers tab to.
  'details > summary:first-of-type',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ')

function isRendered(element: HTMLElement, container: HTMLElement): boolean {
  // The attribute check also covers hidden="until-found", which hides via
  // content-visibility instead of display.
  if (element.closest('[hidden]') !== null) return false
  // `visibility` inherits, so the element's own computed value suffices.
  const visibility = getComputedStyle(element).visibility
  if (visibility === 'hidden' || visibility === 'collapse') return false
  // `display` does not inherit, so ancestors must be walked.
  for (
    let node: HTMLElement | null = element;
    node && node !== container;
    node = node.parentElement
  ) {
    if (getComputedStyle(node).display === 'none') return false
  }
  return true
}

// A named radio participates in a group; groups are scoped by name AND form
// owner, matching the browser's own grouping.
function isGroupedRadio(element: HTMLElement): element is HTMLInputElement {
  return element instanceof HTMLInputElement && element.type === 'radio' && element.name !== ''
}

export function getFocusables(container: HTMLElement): HTMLElement[] {
  const candidates = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const eligible: HTMLElement[] = []
  for (let i = 0; i < candidates.length; i++) {
    const element = candidates[i]!
    // Focusing a non-rendered element is a no-op, so keeping one in the cycle
    // would stall the trap on it.
    if (element.tabIndex >= 0 && isRendered(element, container)) {
      eligible.push(element)
    }
  }

  // Browsers give a same-name radio group ONE tab stop — the checked radio,
  // else the group's first (APG radio group pattern). The trap steps focus
  // itself, so it must reproduce the collapse.
  const focusables: HTMLElement[] = []
  for (let i = 0; i < eligible.length; i++) {
    const element = eligible[i]!
    if (!isGroupedRadio(element)) {
      focusables.push(element)
      continue
    }

    let alreadyStopped = false
    for (let j = 0; j < i; j++) {
      const prior = eligible[j]!
      if (isGroupedRadio(prior) && prior.name === element.name && prior.form === element.form) {
        alreadyStopped = true
        break
      }
    }
    if (alreadyStopped) continue

    let stop: HTMLInputElement = element
    if (!element.checked) {
      for (let j = i + 1; j < eligible.length; j++) {
        const other = eligible[j]!
        if (
          isGroupedRadio(other) &&
          other.name === element.name &&
          other.form === element.form &&
          other.checked
        ) {
          stop = other
          break
        }
      }
    }
    focusables.push(stop)
  }

  return focusables
}
