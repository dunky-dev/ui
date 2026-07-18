import { useId, useRef } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { comboboxMachine, comboboxConnect } from '@dunky.dev/combobox'
import type { ComboboxOptions } from '@dunky.dev/combobox'

import type { ComboboxContextValue } from './context'
import { comboboxEffects } from './effects'

export function useCombobox(options: ComboboxOptions): ComboboxContextValue {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const { api, machine } = useMachine(comboboxMachine, comboboxConnect, comboboxEffects, {
    id,
    ...options,
  })
  return { api, machine, inputRef, triggerRef, listboxRef }
}
