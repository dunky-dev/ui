interface Lock {
  count: number
  savedOverflow: string
  savedPadding: string
}

// One shared lock per scroll container: the first holder saves the target's
// inline state and the last release restores it, so overlapping holders can
// release in any order (a parent layer may close before its child).
const locks = new Map<HTMLElement, Lock>()

// The body's scrollbar lives on the viewport, so it's measured from the
// window; any other container owns its scrollbar, measured from its boxes.
function getScrollbarWidth(target: HTMLElement): number {
  if (target === document.body) {
    return window.innerWidth - document.documentElement.clientWidth
  }
  const style = getComputedStyle(target)
  const borders =
    (Number.parseFloat(style.borderLeftWidth) || 0) +
    (Number.parseFloat(style.borderRightWidth) || 0)
  return target.offsetWidth - target.clientWidth - borders
}

/**
 * Locks scrolling on `target` — the page body by default — padding for the
 * vanished scrollbar so the layout doesn't shift sideways. Returns a release
 * function; the target is restored once every holder has released.
 */
export function lockScroll(target: HTMLElement = document.body): () => void {
  let lock = locks.get(target)
  if (lock === undefined) {
    lock = {
      count: 0,
      savedOverflow: target.style.overflow,
      savedPadding: target.style.paddingRight,
    }
    locks.set(target, lock)
    const scrollbar = getScrollbarWidth(target)
    if (scrollbar > 0) target.style.paddingRight = `${scrollbar}px`
    target.style.overflow = 'hidden'
  }
  lock.count++

  const held = lock
  let released = false
  return () => {
    if (released) return
    released = true
    if (--held.count > 0) return
    locks.delete(target)
    // Assigning '' doesn't clear a longhand in jsdom's CSSOM — remove instead.
    if (held.savedOverflow !== '') target.style.overflow = held.savedOverflow
    else target.style.removeProperty('overflow')
    if (held.savedPadding !== '') target.style.paddingRight = held.savedPadding
    else target.style.removeProperty('padding-right')
  }
}
