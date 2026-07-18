import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { drawerMachine, drawerConnect } from '@dunky.dev/drawer'
import type { DrawerOptions } from '@dunky.dev/drawer'

import type { DrawerContextValue } from './context'
import { drawerEffects } from './effects'

export function useDrawer(options: DrawerOptions): DrawerContextValue {
  const id = useId()
  // `?? id` (not spread order): an explicit `id={undefined}` must not knock out
  // the generated fallback — ids also key the layer stack, so they must exist.
  return useMachine(drawerMachine, drawerConnect, drawerEffects, {
    ...options,
    id: options.id ?? id,
  })
}
