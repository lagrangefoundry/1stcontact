---
uid: acceptance_criterion-b99669e4
id: AC-676
type: acceptance_criterion
title: contact-form fieldLabels=placeholder moves labels into placeholders and visually
  hides the label kept in the DOM
created_by: xgd
created_at: '2026-07-19T03:34:50.541607+00:00'
updated_at: '2026-07-19T03:34:50.541607+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
---

## Criterion
When a contact-form is authored with `fieldLabels: placeholder`, each field's label text appears as the input/textarea placeholder, and the corresponding `<label>` element remains present in the rendered markup (for accessibility) but is visually hidden. With `fieldLabels` unset or `above` (the default), each field renders a visible stacked `<label>` and no label text is injected as a placeholder.

## Verification
Render a contact-form with `fieldLabels: placeholder`; confirm each field's placeholder equals its label text, the `<label>` element is still in the DOM, and it is visually hidden. Render the same form with the default and confirm labels are visible and placeholders are empty.
