---
uid: acceptance_criterion-472674ff
id: AC-1044
type: acceptance_criterion
title: The editing box holding exactly one field opens in its control, ready to type;
  a box with more, or a dialog with a grid, opens none
created_by: xgd
created_at: '2026-08-10T07:48:26.505765+00:00'
updated_at: '2026-08-12T18:26:24.922891+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A form that is the **editing box** — the dressed box a region's words open in —
and holds exactly one field opens with that field already in its control, ready
to type. The form component ordinarily renders a value that becomes a control
when clicked, which is right for a sheet of properties being read; this dialog is
not that — it opened *because* the operator clicked those words, so the value is
not being read and a second click buys nothing. It is also what makes the box a
box you can obviously type in, which is the premise the dropped heading rests on.

The control opens holding the region's current words, and nothing is written by
opening it: a form opened and closed without a change is still not an edit.

The count is taken over **the box's fields alone**, and that scope is the
criterion rather than an exception to it. What is being preserved is that
clicking words puts the cursor in the words; a run that also exposes its
typography in the sheet beneath the box is still one field of words, and counting
every field the region exposes would silently retire the affordance the moment a
region exposed a second parameter.

This applies to exactly one field of words, and only where the box is the only
place the operator can be put:

- where a region exposes two or more fields **to the box**, none is opened,
  because there is no "the" field and opening the first would silently privilege
  it;
- where the dialog also holds a thumbnail grid, no form control is opened either,
  even though the box itself is a lone field. An image region's box is a single
  alt-text field, but the operator clicked a **picture** — putting the cursor in
  its alt text would open the field they did not come for and leave the grid, the
  reason the dialog is open, needing a click to reach. The keyboard belongs in the
  grid in that case.

## Verification

Open the form over a copy region whose box holds a single field and assert the
control is present and holds that region's current words, with no further click.
Assert this still holds where the region also exposes typography parameters in
the sheet beneath the box — the cursor is in the words. Assert closing it without
a change writes nothing and re-renders nothing. Then open the form over a region
exposing two fields to the box and assert neither is opened into its control.
Then open the dialog over an image region — a lone alt-text field beside a
thumbnail grid — and assert the alt-text control is not opened and the keyboard
is in the grid instead.