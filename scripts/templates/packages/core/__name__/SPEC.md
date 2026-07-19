# SPEC / __Name__

## Reference

The sources that make it work: the W3C/ARIA pattern it follows, prior art the
API is modeled on (if any), the Figma link, and any external package it
depends on that affects the primitive's API, intent, and design.

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

## Accessibility

Keyboard, roles, focus, and screen-reader intent — only what isn't already
implied by Behavior. Don't restate a behavior here just because it happens to
be accessibility-relevant.

## Constraints

The non-negotiable invariants that must hold regardless of configuration —
written so an implementation can be checked against it, not to describe one.

## Internals

The design decisions behind the implementation — the state/context model
choices, trade-offs, and non-obvious mechanics a maintainer needs, each with
its why. Nothing a consumer needs in order to use the package.
