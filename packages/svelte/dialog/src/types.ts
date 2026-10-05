import type { Snippet } from 'svelte'
import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements'
import type { DialogOptions } from '@dunky.dev/dialog'

export interface DialogProps extends DialogOptions {
  /** The dialog's parts. */
  children?: Snippet
}

export interface DialogTriggerProps extends HTMLButtonAttributes {
  /** The rendered `<button>`; `bind:ref` to read it. */
  ref?: HTMLButtonElement | null
}

export interface DialogPortalProps {
  /** The layers to teleport. */
  children?: Snippet
  /** The element to portal into. @default document.body */
  container?: HTMLElement | null
}

export interface DialogBackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** The rendered `<div>`; `bind:ref` to read it. */
  ref?: HTMLDivElement | null
}

export interface DialogViewportProps extends HTMLAttributes<HTMLDivElement> {
  /** The rendered `<div>`; `bind:ref` to read it. */
  ref?: HTMLDivElement | null
}

/** An element, or a getter resolved when the element is needed — `bind:this`
 * fills only after the component that declares it has initialized. */
export type DialogFocusTarget = HTMLElement | null | (() => HTMLElement | null | undefined)

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  /** The element to focus when the dialog opens — resolved at open time.
   * @default the dialog window */
  initialFocus?: DialogFocusTarget
  /** Focused on close when nothing meaningful held focus before opening — it
   * sat on the body (a pointer press leaves it there) or on an element since
   * removed. Resolved at close time; typically the dialog's trigger. */
  restoreFocus?: DialogFocusTarget
  /** The rendered `<div>`; `bind:ref` to read it. */
  ref?: HTMLDivElement | null
}

export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The rendered `<h2>`; `bind:ref` to read it. */
  ref?: HTMLHeadingElement | null
}

export interface DialogDescriptionProps extends HTMLAttributes<HTMLDivElement> {
  /** The rendered `<div>`; `bind:ref` to read it. */
  ref?: HTMLDivElement | null
}

export interface DialogCloseProps extends HTMLButtonAttributes {
  /** The rendered `<button>`; `bind:ref` to read it. */
  ref?: HTMLButtonElement | null
}
