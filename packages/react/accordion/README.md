# @dunky.dev/react-accordion

React binding for [`@dunky.dev/accordion`](../../core/accordion): a compound
component — `Accordion` plus its parts — that drives the framework-free
accordion machine. The root owns the machine; parts translate the core's
logical bindings into DOM attributes and handlers, and wire the DOM-only
concerns (moving focus to the trigger the machine picks, hiding closed
content).

Behavior contract: [`../../core/accordion/SPEC.md`](../../core/accordion/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-accordion
```

## Usage

```tsx
import { Accordion } from '@dunky.dev/react-accordion'

function Faq() {
  return (
    <Accordion type='single' collapsible>
      <Accordion.Item value='shipping'>
        <Accordion.Header>
          <Accordion.Trigger>Shipping</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Ships in 3-5 business days.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value='returns'>
        <Accordion.Header>
          <Accordion.Trigger>Returns</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Free returns within 30 days.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
}
```
