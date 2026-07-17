import { useId, useMemo } from 'react'
import { useMachine } from '@dunky.dev/react-state-machine'
import { createDialogConfig, dialogConnect } from '@dunky.dev/dialog'
import type { DialogOptions } from '@dunky.dev/dialog'

import type { DialogContextValue } from './context'
import { dialogEffects } from './effects'

/**
 * Owns one dialog machine for the <Dialog> root. `useMachine` creates it once
 * (StrictMode-safe), re-syncs options each render, runs the substrate effects,
 * and exposes the connected api. Cross-part ids are minted here (SSR-safe) and
 * closed into the config factory.
 */
export function useDialog(options: DialogOptions): DialogContextValue {
  const contentId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const ids = useMemo(
    () => ({ content: contentId, title: titleId, description: descriptionId }),
    [contentId, titleId, descriptionId],
  )

  return useMachine(props => createDialogConfig(props, ids), dialogConnect, dialogEffects, options)
}
