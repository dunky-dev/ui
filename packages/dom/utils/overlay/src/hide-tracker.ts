// The one hide/undo bookkeeping shared by containment (`hideOutside`) and the
// exit window (`hideExitingLayer`): what counts as author-hidden and what the
// undo restores must not drift apart between the two.

export interface HideTracker {
  /** Marks the element `aria-hidden` + `inert` — unless the author already
   * hides it: an existing `inert` or a truthy `aria-hidden` is theirs.
   * (`aria-hidden="false"` asserts visible, the opposite of author-hidden,
   * so it doesn't count and the undo restores the authored value.) */
  hide: (element: Element) => void
  /** Removes exactly what `hide` added. */
  undo: () => void
}

export function createHideTracker(): HideTracker {
  const hidden: Array<[Element, string | null]> = []
  return {
    hide(element) {
      const ariaHidden = element.getAttribute('aria-hidden')
      if ((ariaHidden !== null && ariaHidden !== 'false') || element.hasAttribute('inert')) return
      element.setAttribute('aria-hidden', 'true')
      element.setAttribute('inert', '')
      hidden.push([element, ariaHidden])
    },
    undo() {
      for (const [element, previousAriaHidden] of hidden) {
        if (previousAriaHidden === null) element.removeAttribute('aria-hidden')
        else element.setAttribute('aria-hidden', previousAriaHidden)
        element.removeAttribute('inert')
      }
      hidden.length = 0
    },
  }
}
