# Accessibility

## Overview

Dunky is substrate-agnostic; its accessibility contract is not invented here.
The W3C's web accessibility specs are the baseline for every primitive —
including the ones that never touch a browser.

Behavior is modeled once in `packages/core/<name>` and every substrate
inherits it. That needs a single external definition of what the behavior _is_,
or each host drifts toward whatever its platform makes easy. The W3C specs are
that definition: normative and stable, already mapped onto the native platform
accessibility APIs by [Core-AAM](https://www.w3.org/TR/core-aam-1.2/), and the
same documents our consumers audit against.

So the core machine speaks in ARIA terms and holds itself to WCAG. A binding
_translates_ those terms into its host's API — translation may change the
words, never the behavior. If a host forces a behavioral difference, the
decision moves into the core machine, per
[Boundaries](./AGENTS.md#boundaries).

## References

Primary sources. When shaping a package they are looked up, not recalled.

| Spec                                                | Status                    | What we take from it                                                             |
| --------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/)           | Recommendation (2023)     | The success criteria a primitive must not violate.                               |
| [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) | Recommendation (2023)     | The role, state, and property vocabulary the core machine emits.                 |
| [UAAG 2.0](https://www.w3.org/TR/UAAG20/)           | Working Group Note (2015) | User-agent obligations we must not break or duplicate.                           |
| [ATAG 2.0](https://www.w3.org/TR/ATAG20/)           | Recommendation (2015)     | What lands on us when a consumer builds an authoring tool from these primitives. |
| [WCAG 3.0](https://www.w3.org/TR/wcag-3.0/)         | Working Draft             | Direction of travel only — never cite it as a requirement.                       |

Version notes, so nobody re-litigates them per package: **WAI-ARIA is pinned
to 1.2** — 1.1 is superseded, and [1.3](https://www.w3.org/TR/wai-aria-1.3/)
is a draft read for direction like WCAG 3.0. **WCAG 2.2 is a Recommendation**,
not a candidate one, and it is the bar.

Supporting, but repeatedly load-bearing:

- [APG](https://www.w3.org/WAI/ARIA/apg/) — the patterns. **Advisory**: we
  follow it by default, but a normative spec wins any conflict.
- [Accname](https://www.w3.org/TR/accname-1.2/) — how a name resolves. Needed
  by any primitive with a labelling API.
- [WCAG2ICT](https://www.w3.org/TR/wcag2ict/) — applying WCAG to non-web
  software; why a native or terminal substrate is held to WCAG at all.
- [ARIA in HTML](https://www.w3.org/TR/html-aria/) and
  [`inert`](https://html.spec.whatwg.org/multipage/interaction.html#inert) —
  web substrate only.

## Packages

The `SPEC.md` sets a `## Reference` section when needed, linking the external
reference. See `packages/core/dialog/SPEC.md` and `packages/dom/utils/focus-trap/SPEC.md` for example.

The API must cross-match the reference: every user/dev semantics traces to a
referenced rule or is deliberately ours; every referenced rule is met; the
spec's names win unless there's a reason. **Where the API and a normative spec
disagree, the API is the bug if not explicitly justified**.

A deliberate deviation is justified in that package's SPEC.

## Non-web substrates

Same behavior, same outcomes. What changes is the API it speaks:

- **Mapping** — the ARIA term has a platform counterpart, so the binding
  translates. The normal case; no justification needed. Where the mapping isn't
  mechanical, the substrate spec carries a `core binding -> host property`
  table.

  ```
  role="dialog" + aria-modal="true"
    |
    +-- web     -> role + aria-modal, siblings inert
    +-- native  -> Modal + accessibilityViewIsModal
    +-- tui     -> the substrate's documented equivalent
  ```

- **Extra instruction** — the platform adds obligations the web doesn't (touch
  targets, gestures, hardware Back, VoiceOver/TalkBack idioms). Additive, and
  documented in the substrate's own spec, per
  [Apple](https://developer.apple.com/design/human-interface-guidelines/accessibility),
  [Android](https://developer.android.com/guide/topics/ui/accessibility), and
  [React Native](https://reactnative.dev/docs/accessibility). It must not
  contradict the core contract.
- **Override** — a referenced rule genuinely can't hold here: the host lacks the
  premise (no container portals on native) or its own contract wins (the system
  Back gesture). Record it next to the API it affects: the rule, what happens
  instead, why the host forces it, and what the user still gets. An override
  reinterprets a _mechanism_; a different _decision_ is a core change.
- **Anything that doesn't port gets recorded, not skipped** — the
  [scenario rule](./AGENTS.md#scopes) is an accessibility rule too. A silent
  gap is indistinguishable from an oversight.

Terminal UIs are the sharpest case: no ARIA, no accessibility tree, no
normative spec. What survives is the technology-independent WCAG criteria (via
WCAG2ICT) plus the terminal's own behavior.

## Audit

Accessibility claims are behavior, so they're tested like behavior — in `TEST`,
before the implementation exists.

- **Core** — the semantics the machine emits: resolved role, name and
  description references, which states gate which transitions, the keyboard
  contract.
- **Substrate** — the translation, against what the host consumes: ARIA
  attributes and focus order on the web, real native props on native.
- **Device / browser** — what a mocked host can't reach: real screen readers,
  real hardware Back, real touch. Run native's device flows before a primitive
  leaves experimental.

Automated checks catch missing names and invalid attributes. They don't catch a
focus order that makes no sense or an announcement that misleads — those need a
citation and a human.
