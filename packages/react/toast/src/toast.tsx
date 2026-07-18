import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type ForwardRefExoticComponent,
  type PointerEvent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import type { ToastOptions } from '@dunky.dev/toast'

import { mergeProps, normalize } from '@dunky.dev/react-state-machine'
import {
  ToastContext,
  ToastProviderContext,
  useToastContext,
  useToastProviderContext,
  type ToastProviderContextValue,
} from './context'
import { createToastRegistry } from './registry'
import { useToast } from './use-toast'

// Explicit so the exports satisfy --isolatedDeclarations (a bare forwardRef
// call gives the variable no annotatable type).
type PartComponent<Props, Element> = ForwardRefExoticComponent<Props & RefAttributes<Element>>

// =============================================================================
// <Toast.Provider> — shared config for every toast beneath it, renders no DOM
// =============================================================================

export interface ToastProviderProps {
  /** Default auto-dismiss duration (ms) for toasts without their own. @default 5000 */
  duration?: number
  /** Accessible label of the viewport region. @default 'Notifications' */
  label?: string
  children?: ReactNode
}

export const Provider = ({
  duration = 5000,
  label = 'Notifications',
  children,
}: ToastProviderProps): ReactNode => {
  // One registry per provider, for the provider's lifetime.
  const [registry] = useState(createToastRegistry)
  const viewportRef = useRef<HTMLOListElement>(null)
  const value = useMemo<ToastProviderContextValue>(
    () => ({ duration, label, registry, viewportRef }),
    [duration, label, registry],
  )
  return <ToastProviderContext.Provider value={value}>{children}</ToastProviderContext.Provider>
}

// =============================================================================
// <Toast.Viewport> — the landmark region listing the toasts
// =============================================================================

export interface ToastViewportProps extends ComponentPropsWithoutRef<'ol'> {}

export const Viewport: PartComponent<ToastViewportProps, HTMLOListElement> = forwardRef<
  HTMLOListElement,
  ToastViewportProps
>((props, forwardedRef) => {
  const { label, registry, viewportRef } = useToastProviderContext()
  useImperativeHandle(forwardedRef, () => viewportRef.current as HTMLOListElement)

  // Substrate wiring, not behavior: hover/focus become the pause intent, and
  // each toast's machine decides what pausing means.
  const merged = mergeProps(props as Record<string, unknown>, {
    role: 'region',
    'aria-label': label,
    // Programmatically focusable: dismissing the toast that holds focus parks
    // focus here (see <Toast.Root>), never in the tab order itself.
    tabIndex: -1,
    onPointerEnter: () => registry.pause(),
    // Movement re-pauses after a resume that fired under a resting pointer
    // (e.g. focus blurred out while hovering) — enter alone would not recur.
    onPointerMove: () => registry.pause(),
    onPointerLeave: (event: PointerEvent<HTMLOListElement>) => {
      // Focus still inside keeps the timers paused after the pointer leaves.
      if (!event.currentTarget.contains(document.activeElement)) registry.resume()
    },
    onFocus: () => registry.pause(),
    onBlur: (event: FocusEvent<HTMLOListElement>) => {
      // Only a blur that moves focus out of the viewport resumes.
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) registry.resume()
    },
  })

  return <ol {...merged} ref={viewportRef} />
})

// =============================================================================
// <Toast> — root, owns one toast's machine and renders no DOM
// =============================================================================

export interface ToastProps extends ToastOptions {
  children?: ReactNode
}

export const Toast: ((props: ToastProps) => ReactNode) & Parts = ({ children, ...options }) => {
  const value = useToast(options)
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

// =============================================================================
// <Toast.Root> — the toast surface: the announced live element
// =============================================================================

export interface ToastRootProps extends ComponentPropsWithoutRef<'li'> {}

export const Root: PartComponent<ToastRootProps, HTMLLIElement> = forwardRef<
  HTMLLIElement,
  ToastRootProps
>((props, forwardedRef) => {
  const { api, machine } = useToastContext()
  const { viewportRef } = useToastProviderContext()
  const rootRef = useRef<HTMLLIElement>(null)
  useImperativeHandle(forwardedRef, () => rootRef.current as HTMLLIElement)

  // Removing the element that holds focus dispatches no blur/focusout, which
  // would silently drop focus on <body> and strand the viewport's standing
  // pause. The subscription fires synchronously on close — while the surface
  // is still mounted — so focus can be parked on the viewport (Radix parity):
  // the keyboard user keeps their place and the focus tracking stays truthful.
  useEffect(
    () =>
      machine.select.state().subscribe(state => {
        if (state !== 'closed') return
        const root = rootRef.current
        if (root !== null && root.contains(document.activeElement)) viewportRef.current?.focus()
      }),
    [machine, viewportRef],
  )

  // Nothing is kept mounted while closed; `data-state` covers open styling.
  if (!api.open) return null
  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.root))
  return <li {...merged} ref={rootRef} />
})

// =============================================================================
// <Toast.Title> — names the toast
// =============================================================================

export interface ToastTitleProps extends ComponentPropsWithoutRef<'div'> {}

export const Title: PartComponent<ToastTitleProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  ToastTitleProps
>((props, forwardedRef) => {
  const { api, machine } = useToastContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'title', present: true })
    return () => machine.send({ type: 'part.presence', part: 'title', present: false })
  }, [machine])

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.title))
  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Toast.Description> — the toast's message body
// =============================================================================

export interface ToastDescriptionProps extends ComponentPropsWithoutRef<'div'> {}

export const Description: PartComponent<ToastDescriptionProps, HTMLDivElement> = forwardRef<
  HTMLDivElement,
  ToastDescriptionProps
>((props, forwardedRef) => {
  const { api, machine } = useToastContext()

  useEffect(() => {
    machine.send({ type: 'part.presence', part: 'description', present: true })
    return () => machine.send({ type: 'part.presence', part: 'description', present: false })
  }, [machine])

  const merged = mergeProps(props as Record<string, unknown>, normalize(api.parts.description))
  return <div {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Toast.Action> — the optional action; pressing it dismisses
// =============================================================================

export interface ToastActionProps extends ComponentPropsWithoutRef<'button'> {}

export const Action: PartComponent<ToastActionProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  ToastActionProps
>((props, forwardedRef) => {
  const { api } = useToastContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.action))
  return <button {...merged} ref={forwardedRef} />
})

// =============================================================================
// <Toast.Close> — the explicit dismissal affordance
// =============================================================================

export interface ToastCloseProps extends ComponentPropsWithoutRef<'button'> {}

export const Close: PartComponent<ToastCloseProps, HTMLButtonElement> = forwardRef<
  HTMLButtonElement,
  ToastCloseProps
>((props, forwardedRef) => {
  const { api } = useToastContext()
  const merged = mergeProps({ type: 'button' as const, ...props }, normalize(api.parts.close))
  return <button {...merged} ref={forwardedRef} />
})

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Provider: typeof Provider
  Viewport: typeof Viewport
  Root: typeof Root
  Title: typeof Title
  Description: typeof Description
  Action: typeof Action
  Close: typeof Close
}

Toast.Provider = Provider
Toast.Viewport = Viewport
Toast.Root = Root
Toast.Title = Title
Toast.Description = Description
Toast.Action = Action
Toast.Close = Close
