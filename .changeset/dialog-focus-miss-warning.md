---
'@dunky.dev/dom-dialog': patch
---

`openDialogLayer` now warns when focus cannot move into the dialog at all —
when the initial focus target refuses focus and the dialog window can't take
the fallback either (typically because it lacks `tabindex="-1"`). Focus
stranded outside an open modal breaks the modal dialog pattern; the miss used
to be silent, now the warning names the fix.
