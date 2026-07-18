---
'@dunky.dev/menu': minor
'@dunky.dev/react-menu': minor
---

Add the Menu primitive — a dropdown menu following the WAI-ARIA APG menu-button
pattern, shipped as an agnostic core (`@dunky.dev/menu`) plus a React binding
(`@dunky.dev/react-menu`).

Open it by press or keyboard (Enter/Space/ArrowDown highlight the first enabled
item, ArrowUp the last); while open, arrows move the highlight with wrap,
Home/End jump, printable characters run typeahead over the item labels, and
disabled items are skipped everywhere. Activating an item fires its `onSelect`,
then the menu closes; Escape (returning focus to the trigger), Tab, and any
outside interaction dismiss. The highlight is exposed through
`aria-activedescendant` — DOM focus stays on the menu surface — and styling
hooks are `data-state` on trigger/content plus `data-highlighted` /
`data-disabled` on items. The menu joins the shared overlay layer stack, so
Escape and outside presses unwind stacked overlays one layer at a time.

Controlled `open` follows the dialog's contract: every open/close intent —
trigger press, keyboard open, Escape, Tab, outside interaction, item
activation — is reported through `onOpenChange`, and the menu moves only when
the prop does, so ignoring a report is a working veto.

```tsx
import { Menu } from '@dunky.dev/react-menu'

function App() {
  return (
    <Menu onOpenChange={console.log}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content>
          <Menu.Item value='rename' onSelect={rename}>
            Rename
          </Menu.Item>
          <Menu.Item value='archive' disabled>
            Archive
          </Menu.Item>
          <Menu.Separator />
          <Menu.Group>
            <Menu.GroupLabel>Danger zone</Menu.GroupLabel>
            <Menu.Item value='delete' onSelect={remove}>
              Delete
            </Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  )
}
```
