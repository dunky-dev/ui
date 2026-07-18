import { createContext, useContext, type Context, type RefObject } from 'react'
import type { MenuApi, MenuMachine } from '@dunky.dev/menu'

export interface MenuContextValue {
  api: MenuApi
  machine: MenuMachine
  /** The trigger element, excused from outside-press detection so a press on
   * it toggles instead of dismissing and immediately reopening. */
  triggerRef: RefObject<HTMLButtonElement | null>
}

export const MenuContext: Context<MenuContextValue | undefined> = createContext<
  MenuContextValue | undefined
>(undefined)

export const useMenuContext = (): MenuContextValue => {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('Menu parts must be rendered within a <Menu> root')
  }
  return context
}

// The group id minted by <Menu.Group>; its GroupLabel reads it to wire the
// group's aria-labelledby through the core connect.
export const MenuGroupContext: Context<string | undefined> = createContext<string | undefined>(
  undefined,
)

export const useMenuGroupContext = (): string => {
  const groupId = useContext(MenuGroupContext)
  if (groupId === undefined) {
    throw new Error('Menu.GroupLabel must be rendered within a <Menu.Group>')
  }
  return groupId
}
