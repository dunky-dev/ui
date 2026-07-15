# __Name__ / Specs

## Reference

The sources that make it work: the W3C/ARIA pattern it follows, the state machine
it is built on, the used Radix component, the Figma link, and any external package
it depends on that affects the component API, intent and design.

## Overview

What it is and why it exists.

## Anatomy

The structural parts it's made of, named by role and purpose — not by API or
DOM tag.

```
<Component>
  |_ <Part>   — the first structural part, named by its role and purpose
  |_ <...>
```

## Behavior

How the package behaves in plain language — what happens when the consumer
uses it, told as a walkthrough rather than a prop list. Describe the intent, not
signatures; types and exact prop names live in the code and generated prop docs,
so this doesn't drift.

## States

The runtime states it enters and how they behave.

| State     | Behavior                                          |
| --------- | ------------------------------------------------- |
| `<state>` | What happens when the component is in this state. |
| `<...>`   |                                                   |

### Behavior XYZ

One behavior per subtitle, in plain language: what the consumer does and what
happens. _Example: "Clicking fires the consumer's handler unless the component
is disabled."_

## A11y

Keyboard, roles, focus, and screen-reader intent — only what isn't already
implied by Behavior. Don't restate a behavior here just because it happens to
be accessibility-relevant.

## Constraints

The non-negotiable invariants that must hold regardless of configuration —
written so an implementation can be checked against it, not to describe one.

## Design

The design _decisions_ and how the component fits the rest of the system — not
how it looks. Colors, shapes, spacing, and the visual anatomy live in Figma;
this is the reasoning: why it exists as its own component, how it relates to
neighboring ones, which shared patterns or tokens it reuses, and any trade-offs
made to stay consistent.

_Example: "Reuses the interactive-surface tokens so it reads as the same family
as Button and Chip; kept single-line to match the density of the toolbar it
lives in; no new size scale — aligns with the existing small/large rhythm."_
