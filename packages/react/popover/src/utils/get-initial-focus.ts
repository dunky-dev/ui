import { getFocusables } from '@dunky.dev/dom-focus-trap'

// The popover rule: focus the first focusable element in the panel, else the
// panel itself (focusable in script, not in the tab order).
export function getInitialFocus(content: HTMLElement): HTMLElement {
  return getFocusables(content)[0] ?? content
}
