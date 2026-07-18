// The strict rule is only that focus moves into the dialog: a dialog that
// collects input starts at its first form field; any other content keeps
// focus on the dialog window itself.
const FORM_FIELD_SELECTOR =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'

export function getInitialFocus(content: HTMLElement): HTMLElement {
  return content.querySelector<HTMLElement>(FORM_FIELD_SELECTOR) ?? content
}
