// The alert-dialog initial-focus policy: focus starts on the least destructive
// answer — the rendered Cancel part, found by its connect-derived id — so an
// accidental Enter never confirms. Without one, focus stays on the alert
// dialog window itself.
export function getInitialFocus(content: HTMLElement, cancelId: string): HTMLElement {
  // getElementById, not querySelector: the substrate-minted base id contains
  // characters a CSS selector would need escaped.
  const cancel = document.getElementById(cancelId)
  return cancel !== null && content.contains(cancel) ? cancel : content
}
