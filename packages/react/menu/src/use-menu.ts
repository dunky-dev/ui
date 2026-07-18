import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { menuMachine, menuConnect } from '@dunky.dev/menu'
import type { MenuOptions } from '@dunky.dev/menu'

import type { MenuContextValue } from './context'
import { menuEffects } from './effects'

export function useMenu(options: MenuOptions): Pick<MenuContextValue, 'api' | 'machine'> {
  const id = useId()
  // `?? id` (not spread order): an explicit `id={undefined}` must not knock out
  // the generated fallback — ids also key the layer stack, so they must exist.
  return useMachine(menuMachine, menuConnect, menuEffects, {
    ...options,
    id: options.id ?? id,
  })
}
