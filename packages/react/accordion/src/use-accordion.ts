import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { accordionMachine, accordionConnect } from '@dunky.dev/accordion'
import type { AccordionOptions } from '@dunky.dev/accordion'

import type { AccordionContextValue } from './context'
import { accordionEffects } from './effects'

export function useAccordion(options: AccordionOptions): AccordionContextValue {
  const id = useId()
  // `?? id` (not spread order): an explicit `id={undefined}` must not knock out
  // the generated fallback — the focus effect resolves triggers by these ids.
  return useMachine(accordionMachine, accordionConnect, accordionEffects, {
    ...options,
    id: options.id ?? id,
  })
}
