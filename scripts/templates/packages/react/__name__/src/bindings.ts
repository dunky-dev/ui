import type { __Name__PartBindings } from '@dunky.dev/__name__'

// The core speaks a substrate-neutral vocabulary (`onPress`, ...); this is the
// React side of the contract: logical bindings -> DOM props. Grow it together
// with the core's binding vocabulary.
export function toDomProps(bindings: __Name__PartBindings): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  if (bindings.id !== undefined) props.id = bindings.id
  if (bindings.disabled !== undefined) props.disabled = bindings.disabled
  if (bindings['data-state'] !== undefined) props['data-state'] = bindings['data-state']
  if (bindings.onPress !== undefined) {
    const onPress = bindings.onPress
    props.onClick = () => onPress()
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
