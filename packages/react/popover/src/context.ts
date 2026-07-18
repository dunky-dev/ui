import { createContext, useContext, type Context, type RefObject } from 'react'
import type { PopoverApi, PopoverMachine } from '@dunky.dev/popover'

export interface PopoverContextValue {
  api: PopoverApi
  machine: PopoverMachine
  // The trigger's element, so Content's outside detection can excuse it: a
  // trigger press must reach the machine exactly once, as `toggle` — never as
  // an outside interaction (no dismiss-then-reopen).
  triggerRef: RefObject<HTMLButtonElement | null>
}

export const PopoverContext: Context<PopoverContextValue | undefined> = createContext<
  PopoverContextValue | undefined
>(undefined)

export const usePopoverContext = (): PopoverContextValue => {
  const context = useContext(PopoverContext)
  if (context === undefined) {
    throw new Error('Popover parts must be rendered within a <Popover> root')
  }
  return context
}
