import { useId, useRef } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { popoverMachine, popoverConnect } from '@dunky.dev/popover'
import type { PopoverOptions } from '@dunky.dev/popover'

import type { PopoverContextValue } from './context'
import { popoverEffects } from './effects'

export function usePopover(options: PopoverOptions): PopoverContextValue {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  // `?? id` (not spread order): an explicit `id={undefined}` must not knock out
  // the generated fallback — ids also key the layer stack, so they must exist.
  const { api, machine } = useMachine(popoverMachine, popoverConnect, popoverEffects, {
    ...options,
    id: options.id ?? id,
  })
  return { api, machine, triggerRef }
}
