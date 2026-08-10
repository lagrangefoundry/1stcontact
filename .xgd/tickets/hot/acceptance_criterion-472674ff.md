---
uid: acceptance_criterion-472674ff
id: AC-1044
type: acceptance_criterion
title: A form with exactly one field opens in its control, ready to type; a form with
  more opens none
created_by: xgd
created_at: '2026-08-10T07:48:26.505765+00:00'
updated_at: '2026-08-10T07:48:26.505765+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A form with exactly one field opens with that field already in its control,
ready to type. The form component ordinarily renders a value that becomes a
control when clicked, which is right for a sheet of properties being read; this
dialog is not that — it opened *because* the operator clicked those words, so
the value is not being read and a second click buys nothing. It is also what
makes the box a box you can obviously type in, which is the premise the dropped
heading rests on.

The control opens holding the region's current words, and nothing is written by
opening it: a form opened and closed without a change is still not an edit.

This applies to exactly one field. Where a region exposes two or more — an image
region's handle and its alt text — none is opened, because there is no "the"
field and opening the first would silently privilege it.

## Verification

Open the form over a copy region exposing a single field and assert the control
is present and holds that region's current words, with no further click. Assert
closing it without a change writes nothing and re-renders nothing. Then open the
form over a region exposing two fields and assert neither is opened into its
control.
