import {
  forwardRef,
  useEffect,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { CheckboxOptions } from '@dunky.dev/checkbox'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { CheckboxContext, useCheckboxContext } from './context'
import { useCheckbox } from './use-checkbox'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Checkbox> — root, owns the machine and renders no DOM
// =============================================================================

export interface CheckboxProps extends CheckboxOptions {
  children?: ReactNode
}

export const Checkbox: ((props: CheckboxProps) => ReactNode) & Parts = ({
  children,
  ...options
}) => {
  const value = useCheckbox(options)
  return <CheckboxContext.Provider value={value}>{children}</CheckboxContext.Provider>
}

// =============================================================================
// <Checkbox.Control> — the interactive element: role=checkbox, toggles on press
// =============================================================================

export interface CheckboxControlProps extends ComponentPropsWithoutRef<'button'> {}

export const Control: PartComponent<CheckboxControlProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  CheckboxControlProps
>((props, forwardedRef) => {
  const { api } = useCheckboxContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.control))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Checkbox.Indicator> — the visual mark; mounted only while checked or
// indeterminate
// =============================================================================

export interface CheckboxIndicatorProps extends ComponentPropsWithoutRef<'span'> {}

export const Indicator: PartComponent<CheckboxIndicatorProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  CheckboxIndicatorProps
>((props, forwardedRef) => {
  const { api } = useCheckboxContext()
  if (api.checked === false) return null

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.indicator))
  return <span {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Checkbox.Label> — names the control; pressing it toggles too
// =============================================================================

export interface CheckboxLabelProps extends ComponentPropsWithoutRef<'span'> {}

export const Label: PartComponent<CheckboxLabelProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  CheckboxLabelProps
>((props, forwardedRef) => {
  const { api, machine } = useCheckboxContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'label', present: true })
    return () => machine.send({ type: 'part.presence', part: 'label', present: false })
  }, [machine])

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.label))
  return <span {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Control: typeof Control
  Indicator: typeof Indicator
  Label: typeof Label
}

Checkbox.Control = Control
Checkbox.Indicator = Indicator
Checkbox.Label = Label
