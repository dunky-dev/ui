# @dunky.dev/react-tabs

React binding for [`@dunky.dev/tabs`](../../core/tabs): a compound component —
`Tabs` plus its parts — that drives the framework-free tabs machine. The root
owns the machine; parts translate the core's logical bindings into DOM
attributes and handlers, and wire the DOM-only concerns (tab registration,
moving real focus to the machine-designated tab).

Behavior contract: [`../../core/tabs/SPEC.md`](../../core/tabs/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-tabs
```

## Usage

```tsx
import { Tabs } from '@dunky.dev/react-tabs'

function Settings() {
  return (
    <Tabs defaultValue='account'>
      <Tabs.List aria-label='Settings'>
        <Tabs.Trigger value='account'>Account</Tabs.Trigger>
        <Tabs.Trigger value='security'>Security</Tabs.Trigger>
        <Tabs.Trigger value='billing' disabled>
          Billing
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value='account'>Account settings</Tabs.Content>
      <Tabs.Content value='security'>Security settings</Tabs.Content>
      <Tabs.Content value='billing'>Billing settings</Tabs.Content>
    </Tabs>
  )
}
```
