interface Lock {
  count: number
  savedOverflow: string
  savedPaddingInlineEnd: string
  savedPaddingBlockEnd: string
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
 * vanished scrollbars so the layout doesn't shift. Compensation uses logical
 * properties: the vertical scrollbar always sits at `inline-end` (right in
 * LTR, left in RTL) and the horizontal one at `block-end`, so writing
 * direction is handled for free. Returns a release function; the target is
 * restored once every holder has released.
 */
export function lockScroll(target: HTMLElement = document.body): () => void {
  let lock = locks.get(target)
  if (lock === undefined) {
    lock = {
      count: 0,
      savedOverflow: target.style.overflow,
      savedPaddingInlineEnd: target.style.paddingInlineEnd,
      savedPaddingBlockEnd: target.style.paddingBlockEnd,
    }
    locks.set(target, lock)
    const scrollbar = getScrollbarSizes(target)
    if (scrollbar.width > 0) target.style.paddingInlineEnd = `${scrollbar.width}px`
    if (scrollbar.height > 0) target.style.paddingBlockEnd = `${scrollbar.height}px`
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
    if (held.savedPaddingInlineEnd !== '') {
      target.style.paddingInlineEnd = held.savedPaddingInlineEnd
    } else {
      target.style.removeProperty('padding-inline-end')
    }
    if (held.savedPaddingBlockEnd !== '') {
      target.style.paddingBlockEnd = held.savedPaddingBlockEnd
    } else {
      target.style.removeProperty('padding-block-end')
    }
  }
}
