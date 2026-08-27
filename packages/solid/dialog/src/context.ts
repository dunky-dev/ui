import { createContext, useContext, type Accessor, type Context } from 'solid-js'
import type { DialogApi, DialogMachine } from '@dunky.dev/dialog'

export interface DialogContextValue {
  // Fine-grained store proxy: reading a field subscribes to exactly that leaf.
  api: DialogApi
  machine: DialogMachine
  // Nesting level (1 = top-level); decides the topmost dialog of a stack.
  depth: number
  // The Portal's container (null = page body); an accessor so it stays live.
  container: Accessor<HTMLElement | null>
  // The rendered Backdrop, shared so Content's stack entry can except it from
  // the containment. A plain box, not a signal: the layer walk reads it in the
  // same settle that mounts the backdrop, before a signal write would commit.
  backdropRef: { current: HTMLDivElement | null }
  // The rendered Content, shared so Viewport's non-modal outside-press
  // watcher (a document-level listener, since a `pointer-events: none`
  // Viewport never receives those presses itself) knows what "inside" means.
  contentRef: { current: HTMLDivElement | null }
  // The rendered Trigger, shared for the same watcher: its own press stays a
  // plain toggle — counting it as outside would close and immediately reopen.
  triggerRef: { current: HTMLButtonElement | null }
  // Whether the most recent press began inside Content — see
  // `trackPressOrigin`. Read by Backdrop and Viewport to refuse a
  // text-selection drag that starts inside and releases outside.
  pressOriginRef: { current: (() => boolean) | null }
}

// A `null` default: a default-less context throws on the root's optional
// parent lookup; the wrapper restores the loud error for parts.
export const DialogContext: Context<DialogContextValue | null> =
  createContext<DialogContextValue | null>(null)

export const useDialogContext = (): DialogContextValue => {
  const context = useContext(DialogContext)
  if (context === null) {
    throw new Error('Dialog parts must be rendered within a <Dialog> root')
  }
  return context
}
