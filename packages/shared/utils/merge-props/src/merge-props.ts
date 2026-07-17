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
