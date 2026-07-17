interface Lock {
  count: number
  savedOverflow: string
  savedPaddingRight: string
  savedPaddingBottom: string
}

// One shared lock per scroll container: the first holder saves the target's
// inline state and the last release restores it, so overlapping holders can
// release in any order (a parent layer may close before its child).
const locks = new Map<HTMLElement, Lock>()

interface ScrollbarSizes {
  /** The vertical scrollbar's footprint — horizontal space it occupied. */
  width: number
  /** The horizontal scrollbar's footprint — vertical space it occupied. */
  height: number
}

// The body's scrollbars live on the viewport, so they're measured from the
// window; any other container owns its scrollbars, measured from its boxes.
function getScrollbarSizes(target: HTMLElement): ScrollbarSizes {
  if (target === document.body) {
    return {
      width: window.innerWidth - document.documentElement.clientWidth,
      height: window.innerHeight - document.documentElement.clientHeight,
    }
  }
  const style = getComputedStyle(target)
  const bordersX =
    (Number.parseFloat(style.borderLeftWidth) || 0) +
    (Number.parseFloat(style.borderRightWidth) || 0)
  const bordersY =
    (Number.parseFloat(style.borderTopWidth) || 0) +
    (Number.parseFloat(style.borderBottomWidth) || 0)
  return {
    width: target.offsetWidth - target.clientWidth - bordersX,
    height: target.offsetHeight - target.clientHeight - bordersY,
  }
}

/**
 * Locks scrolling on `target` — the page body by default — padding for the
 * vanished scrollbars (right for the vertical one, bottom for the horizontal
 * one) so the layout doesn't shift. Returns a release function; the target is
 * restored once every holder has released.
 */
export function lockScroll(target: HTMLElement = document.body): () => void {
  let lock = locks.get(target)
  if (lock === undefined) {
    lock = {
      count: 0,
      savedOverflow: target.style.overflow,
      savedPaddingRight: target.style.paddingRight,
      savedPaddingBottom: target.style.paddingBottom,
    }
    locks.set(target, lock)
    const scrollbar = getScrollbarSizes(target)
    if (scrollbar.width > 0) target.style.paddingRight = `${scrollbar.width}px`
    if (scrollbar.height > 0) target.style.paddingBottom = `${scrollbar.height}px`
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
    if (held.savedPaddingRight !== '') target.style.paddingRight = held.savedPaddingRight
    else target.style.removeProperty('padding-right')
    if (held.savedPaddingBottom !== '') target.style.paddingBottom = held.savedPaddingBottom
    else target.style.removeProperty('padding-bottom')
  }
}
