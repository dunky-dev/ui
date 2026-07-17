// One shared lock for the whole document: the first holder saves the body's
// inline state and the last release restores it, so overlapping holders can
// release in any order (a parent layer may close before its child).
let lockCount = 0
let savedOverflow = ''
let savedPadding = ''

/**
 * Locks body scrolling, padding for the vanished scrollbar so the page
 * doesn't shift sideways. Returns a release function; the body is restored
 * once every holder has released.
 */
export function lockBodyScroll(): () => void {
  const { body } = document
  if (++lockCount === 1) {
    savedOverflow = body.style.overflow
    savedPadding = body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    body.style.overflow = 'hidden'
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--lockCount > 0) return
    // Assigning '' doesn't clear a longhand in jsdom's CSSOM — remove instead.
    if (savedOverflow !== '') body.style.overflow = savedOverflow
    else body.style.removeProperty('overflow')
    if (savedPadding !== '') body.style.paddingRight = savedPadding
    else body.style.removeProperty('padding-right')
  }
}
