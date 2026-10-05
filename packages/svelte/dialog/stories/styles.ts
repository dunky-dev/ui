// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on every part is the real styling hook. Svelte styles
// are strings; later declarations win, which the variants below lean on.
export const backdrop = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);'
export const viewport = 'position: fixed; inset: 0; display: flex; overflow: auto; padding: 24px;'
// `margin: auto` inside the viewport's flex box does the centering;
// `relative` makes the corner Close button pin to the window, not the page.
export const content = `
  position: relative; margin: auto; max-width: 480px; padding: 24px; background: white;
  border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
`
export const actions = 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;'
export const closeIcon = `
  position: absolute; top: 12px; inset-inline-end: 12px; width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center; border: none;
  border-radius: 6px; background: transparent; cursor: pointer; font-size: 18px; line-height: 1;
`
export const field = 'display: flex; flex-direction: column; gap: 4px; margin-top: 12px;'
export const input = 'padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font: inherit;'

// A scoped dialog opens inside a container instead of over the whole page: it
// portals into that element, and its overlay layers switch from `fixed`
// (viewport-pinned) to `absolute` (container-pinned).
//
// CSS constraint: an `absolute` overlay can't stay fixed inside a *scrolling*
// element — it's positioned against the scroll origin and scrolls away. So the
// scrollable background goes in an inner scroller, wrapped by a NON-scrolling
// positioned boundary; the overlay pins to the boundary's visible box and the
// backdrop (a sibling on top of the scroller) blocks scrolling behind it.
export const scopedBoundary = `
  position: relative; height: 320px; overflow: hidden; border: 1px solid #ccc;
  border-radius: 8px;
`
export const scopedScroller = 'height: 100%; overflow: auto; padding: 16px; box-sizing: border-box;'
export const scopedBackdrop = `${backdrop} position: absolute;`
export const scopedViewport = `${viewport} position: absolute;`

// Dialog.Close is the dialog's single dismissal affordance — the corner `×`,
// kept the focus cycle's last stop by the core contract. Buttons that act
// (Cancel / Confirm / Delete) are the consumer's own, driving the dialog
// through state — see the alertDialog story.
export const closableContent = `${content} position: relative;`

export const listbox = `
  position: absolute; top: 100%; left: 0; min-width: 220px; margin: 4px 0 0; padding: 4px;
  list-style: none; background: white; border: 1px solid #ccc; border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
`
export const option = 'padding: 6px 10px; border-radius: 4px; cursor: pointer;'

// The containment story's app branch: the panel's absolute viewport pins to it.
export const appBranch = `
  position: relative; margin-top: 16px; padding: 16px; border: 1px dashed #999;
  border-radius: 8px;
`
export const branchViewport = 'position: absolute; inset: 0; display: flex; padding: 16px;'
export const branchPanel = `
  margin: auto; max-width: 320px; padding: 16px; background: white; border: 1px solid #ccc;
  border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
`
