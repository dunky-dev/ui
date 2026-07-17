import type { DialogPartBindings, DismissPayload } from '@dunky.dev/dialog'

// The core speaks a substrate-neutral vocabulary (`labelledBy`, `onPress`, ...);
// this is the React side of the contract: logical bindings -> DOM props.
export function toDomProps(bindings: DialogPartBindings): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  if (bindings.id !== undefined) props.id = bindings.id
  if (bindings.role !== undefined) props.role = bindings.role
  if (bindings.modal !== undefined) props['aria-modal'] = bindings.modal
  if (bindings.hasPopup !== undefined) props['aria-haspopup'] = bindings.hasPopup
  if (bindings.expanded !== undefined) props['aria-expanded'] = bindings.expanded
  if (bindings.controls !== undefined) props['aria-controls'] = bindings.controls
  if (bindings.labelledBy !== undefined) props['aria-labelledby'] = bindings.labelledBy
  if (bindings.describedBy !== undefined) props['aria-describedby'] = bindings.describedBy
  // `focusable: false` marks the initial-focus target: in script, out of the tab order.
  if (bindings.focusable === false) props.tabIndex = -1
  if (bindings['data-state'] !== undefined) props['data-state'] = bindings['data-state']
  if (bindings.onPress !== undefined) {
    const onPress = bindings.onPress
    // A React synthetic event satisfies the DismissPayload contract directly.
    props.onClick = (event: DismissPayload) => onPress(event)
  }
  return props
}

/**
 * Merge consumer props with behavior props: behavior values win, except
 * handlers, which chain (consumer first, then behavior) so a consumer's
 * `onClick` still runs alongside the part's.
 */
export function mergeProps<Props extends Record<string, unknown>>(
  consumer: Props,
  behavior: Record<string, unknown>,
): Props {
  const merged: Record<string, unknown> = { ...consumer, ...behavior }
  for (const key in behavior) {
    const consumerValue = consumer[key]
    const behaviorValue = behavior[key]
    if (typeof consumerValue === 'function' && typeof behaviorValue === 'function') {
      merged[key] = (...args: unknown[]) => {
        consumerValue(...args)
        behaviorValue(...args)
      }
    }
  }
  return merged as Props
}
