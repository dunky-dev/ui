/**
 * The element's position among the rendered options of `listbox`, or
 * undefined when either side isn't rendered (the machine appends then).
 * Registration reports this so the machine's navigation order matches the
 * rendered order even when the consumer's filtering unmounts and remounts
 * items — a remounted item registers back at its rendered position, not at
 * the end — or when a keyed re-sort moves the rendered nodes in place.
 */
export function documentIndex(
  listbox: HTMLElement | null,
  element: HTMLElement | null,
): number | undefined {
  if (listbox === null || element === null) return undefined
  const options = listbox.querySelectorAll('[role="option"]')
  for (let i = 0; i < options.length; i++) {
    if (options[i] === element) return i
  }
  return undefined
}
