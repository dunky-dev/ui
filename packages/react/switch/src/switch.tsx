import {
  forwardRef,
  useEffect,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { SwitchOptions } from '@dunky.dev/switch'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import { SwitchContext, useSwitchContext } from './context'
import { useSwitch } from './use-switch'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Switch> — root, owns the machine and renders no DOM
// =============================================================================

export interface SwitchProps extends SwitchOptions {
  children?: ReactNode
}

export const Switch: ((props: SwitchProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const value = useSwitch(options)
  return <SwitchContext.Provider value={value}>{children}</SwitchContext.Provider>
}

// =============================================================================
// <Switch.Control> — the interactive element: switch role, checked state,
// toggles on press
// =============================================================================

export interface SwitchControlProps extends ComponentPropsWithoutRef<'button'> {}

export const Control: PartComponent<SwitchControlProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  SwitchControlProps
>((props, forwardedRef) => {
  const { api } = useSwitchContext()
  // A native button, so Space/Enter activation arrives as the same press.
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.control))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Switch.Thumb> — the knob; purely visual, styled off data-state
// =============================================================================

export interface SwitchThumbProps extends ComponentPropsWithoutRef<'span'> {}

export const Thumb: PartComponent<SwitchThumbProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  SwitchThumbProps
>((props, forwardedRef) => {
  const { api } = useSwitchContext()
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.thumb))
  return <span {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Switch.Label> — the switch's accessible name; pressing it toggles
// =============================================================================

export interface SwitchLabelProps extends ComponentPropsWithoutRef<'span'> {}

export const Label: PartComponent<SwitchLabelProps, HTMLSpanElement> = forwardRef<
  HTMLSpanElement,
  SwitchLabelProps
>((props, forwardedRef) => {
  const { api, machine } = useSwitchContext()

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
  Thumb: typeof Thumb
  Label: typeof Label
}

Switch.Control = Control
Switch.Thumb = Thumb
Switch.Label = Label
