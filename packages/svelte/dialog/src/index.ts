import type { Component } from 'svelte'
import Root from './dialog.svelte'
import Backdrop from './dialog-backdrop.svelte'
import Close from './dialog-close.svelte'
import Content from './dialog-content.svelte'
import Description from './dialog-description.svelte'
import Portal from './dialog-portal.svelte'
import Title from './dialog-title.svelte'
import Trigger from './dialog-trigger.svelte'
import Viewport from './dialog-viewport.svelte'
import type { DialogProps } from './types.js'

interface Parts {
  Trigger: typeof Trigger
  Portal: typeof Portal
  Backdrop: typeof Backdrop
  Viewport: typeof Viewport
  Content: typeof Content
  Title: typeof Title
  Description: typeof Description
  Close: typeof Close
}

// One component per file is Svelte's unit, so the compound is assembled here:
// the parts hang off the root as statics, reached as `<Dialog.Trigger>`. The
// root binds nothing (`''`): `open` is deliberately not bindable (SPEC.md).
export const Dialog: Component<DialogProps, {}, ''> & Parts = Object.assign(Root, {
  Trigger,
  Portal,
  Backdrop,
  Viewport,
  Content,
  Title,
  Description,
  Close,
})

export type {
  DialogFocusTarget,
  DialogProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogBackdropProps,
  DialogViewportProps,
  DialogContentProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
} from './types.js'
export type { DialogCallbacks, DialogOptions, DialogRole } from '@dunky.dev/dialog'
