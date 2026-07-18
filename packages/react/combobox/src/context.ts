import { createContext, useContext, type Context, type RefObject } from 'react'
import type { ComboboxApi, ComboboxMachine } from '@dunky.dev/combobox'

export interface ComboboxContextValue {
  api: ComboboxApi
  machine: ComboboxMachine
  // The anchor elements, so the Listbox's outside detection can excuse them:
  // a press on the input or the trigger must reach the machine exactly once —
  // never as an outside interaction (no dismiss-then-reopen). The trigger also
  // hands focus to the input through inputRef.
  inputRef: RefObject<HTMLInputElement | null>
  triggerRef: RefObject<HTMLButtonElement | null>
  // The listbox element, so each Item can report its position among the
  // rendered options when it registers.
  listboxRef: RefObject<HTMLDivElement | null>
}

export const ComboboxContext: Context<ComboboxContextValue | undefined> = createContext<
  ComboboxContextValue | undefined
>(undefined)

export const useComboboxContext = (): ComboboxContextValue => {
  const context = useContext(ComboboxContext)
  if (context === undefined) {
    throw new Error('Combobox parts must be rendered within a <Combobox> root')
  }
  return context
}

// The owning item's value, so ItemIndicator knows which suggestion it
// decorates without a prop. Kept internal — parts reason through the root
// context.
export const ComboboxItemContext: Context<string | undefined> = createContext<string | undefined>(
  undefined,
)

export const useComboboxItemContext = (): string => {
  const value = useContext(ComboboxItemContext)
  if (value === undefined) {
    throw new Error('Combobox item parts must be rendered within a <Combobox.Item>')
  }
  return value
}
