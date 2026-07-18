import { useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { tabsMachine, tabsConnect } from '@dunky.dev/tabs'
import type { TabsOptions } from '@dunky.dev/tabs'

import type { TabsContextValue } from './context'
import { tabsEffects } from './effects'

export function useTabs(options: TabsOptions): TabsContextValue {
  const id = useId()
  return useMachine(tabsMachine, tabsConnect, tabsEffects, { id, ...options })
}
