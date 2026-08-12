---
uid: acceptance_criterion-fd4471a9
id: AC-1039
type: acceptance_criterion
title: The editing box drops its heading and label column while keeping both accessible
  names; the parameter sheet, refusals and dead ends keep theirs
created_by: xgd
created_at: '2026-08-10T07:47:00.779120+00:00'
updated_at: '2026-08-12T18:26:35.425612+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

The form over a region's **words** — the dressed editing box — carries no visible
heading naming it and no column of labels beside its controls: both named a box
the operator can obviously type in, and the label column spent a large fraction
of the dialog's width restating what the words in the box already say.

The drop is **scoped to the box**, and the scope is what the criterion has always
been about rather than a later concession. The redundancy being removed was a
label reading "Text" beside the words themselves. The sheet of parameters beneath
the box is the opposite case and **keeps its labels**: a bare number or a bare
weight is meaningless unlabelled, and nothing about the control it sits in says
which axis it is.

Neither drop costs anything a screen reader needs. The dialog keeps its
accessible name — the name the heading was really carrying — and each control
keeps its label as its own accessible name, supplied by the form component from
the same field description the command line and the AI surface read. The field
description is unchanged; only its rendering as a visible column beside the words
is dropped.

Where the heading **is** the content it stays: a refusal and a region with
nothing editable each keep their heading, because removing it would leave a bare
sentence floating over a Close button.

## Verification

Open the form over a copy region and assert the dialog renders no visible
heading, and that within the editing box there is no visible label element, while
the dialog carries an accessible name and the control carries the field's label
as its accessible name. Assert the field description still carries that label.
Assert the parameter sheet beneath the box does render visible labels for the
parameters it holds. Then trigger a refusal dialog and a nothing-to-edit dialog
and assert each renders its heading with the expected text.
