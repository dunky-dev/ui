import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { tooltipMachine, tooltipConnect } from '@dunky.dev/tooltip'
import type { TooltipOptions } from '@dunky.dev/tooltip'

import type { TooltipContextValue } from './context'
import { tooltipEffects } from './effects'

export function useTooltip(options: TooltipOptions): TooltipContextValue {
  const id = useId()
  return useMachine(tooltipMachine, tooltipConnect, tooltipEffects, { id, ...options })
}
