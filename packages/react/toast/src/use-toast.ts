import { useEffect, useId } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { toastMachine, toastConnect } from '@dunky.dev/toast'
import type { ToastOptions } from '@dunky.dev/toast'

import { useToastProviderContext, type ToastContextValue } from './context'
import { toastEffects } from './effects'

export function useToast(options: ToastOptions): ToastContextValue {
  const provider = useToastProviderContext()
  const id = useId()
  const value = useMachine(toastMachine, toastConnect, toastEffects, {
    id,
    ...options,
    duration: options.duration ?? provider.duration,
  })

  // Joining the registry is what subscribes this toast to the viewport's
  // pause/resume broadcasts.
  const { registry } = provider
  const { machine } = value
  useEffect(() => registry.register(machine), [registry, machine])

  return value
}
