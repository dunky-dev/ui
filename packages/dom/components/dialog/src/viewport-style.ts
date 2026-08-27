/**
 * The Viewport's pointer-events reach. Modal: unset — it is the outside-
 * press surface for whatever gutter sits around the window. Non-modal: the
 * page coexists with the dialog, so the Viewport's own full-coverage box
 * must not swallow presses meant for whatever sits beneath it — `none` lets
 * them fall through; the window stays reachable regardless (see
 * `contentPointerEvents`).
 */
export function viewportPointerEvents(modal: boolean): 'none' | undefined {
  return modal ? undefined : 'none'
}

/** The dialog window always stays interactive, even where its Viewport
 * disables pointer events to let non-modal presses fall through around it. */
export const contentPointerEvents = 'auto' as const
