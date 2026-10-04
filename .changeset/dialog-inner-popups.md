---
'@dunky.dev/dom-dialog': patch
---

A popup opened inside the dialog owns Tab and Escape while it holds focus.

A select menu, a popover, a menu, or a combobox list inside a modal dialog —
from any library, as long as it carries ARIA popup semantics — is not a layer
the stack knows, so the dialog kept treating itself as topmost: its
capture-phase Escape closed the dialog together with the popup, and its focus
trap cancelled Tab inside the popup and pulled focus back into the window. Both
now stand down while such a popup holds focus and resume once focus is back in
the window, so one Escape closes the popup and the next reaches the dialog. A
control whose popup is expanded (a combobox input) hands over Escape only; Tab
is how its popup is left, so the trap keeps it.
