/** The vetoable payload a logical press handler may receive. */
export interface PressPayload {
  defaultPrevented: boolean
  preventDefault: () => void
}

/**
 * The substrate-neutral vocabulary a core connect may emit for a part. Every
 * key is optional — a part carries only what it needs. A core package narrows
 * this structurally with its own local PartBindings type (never an import —
 * core depends only on the machine runtime); new logical keys are added HERE
 * so every substrate's translation picks them up.
 */
export interface LogicalBindings {
  id?: string
  role?: string
  modal?: boolean
  hasPopup?: string
  expanded?: boolean
  controls?: string
  labelledBy?: string
  describedBy?: string
  disabled?: boolean
  /** `false` marks a script-focusable element kept out of the tab order. */
  focusable?: boolean
  'data-state'?: string
  onPress?: (event?: PressPayload) => void
}

/**
 * Logical bindings -> DOM props: the core decides WHAT a part carries, this
 * decides HOW it lands on a DOM host (`labelledBy` -> `aria-labelledby`,
 * `onPress` -> `onClick`, ...). JSX-style substrates spread the result as-is.
 */
export function toDomProps(bindings: LogicalBindings): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  if (bindings.id !== undefined) props.id = bindings.id
  if (bindings.role !== undefined) props.role = bindings.role
  if (bindings.modal !== undefined) props['aria-modal'] = bindings.modal
  if (bindings.hasPopup !== undefined) props['aria-haspopup'] = bindings.hasPopup
  if (bindings.expanded !== undefined) props['aria-expanded'] = bindings.expanded
  if (bindings.controls !== undefined) props['aria-controls'] = bindings.controls
  if (bindings.labelledBy !== undefined) props['aria-labelledby'] = bindings.labelledBy
  if (bindings.describedBy !== undefined) props['aria-describedby'] = bindings.describedBy
  if (bindings.disabled !== undefined) props.disabled = bindings.disabled
  if (bindings.focusable === false) props.tabIndex = -1
  if (bindings['data-state'] !== undefined) props['data-state'] = bindings['data-state']
  if (bindings.onPress !== undefined) {
    const onPress = bindings.onPress
    // A DOM event satisfies the PressPayload contract directly.
    props.onClick = (event: PressPayload) => onPress(event)
  }
  return props
}
