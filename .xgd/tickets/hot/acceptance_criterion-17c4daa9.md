---
uid: acceptance_criterion-17c4daa9
id: AC-798
type: acceptance_criterion
title: Each mounted behaviour's fields are derived from the captured control facts
created_by: xgd
created_at: '2026-08-03T03:47:25.831353+00:00'
updated_at: '2026-08-03T04:01:07.793608+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
Every field of a mounted behaviour is derived from what the capture recorded
about that control and from nothing else:

- its label is the control's captured accessible name, verbatim;
- its submission key is derived from that label and is unique within the form;
- its type is the control's captured type where the capture recorded one, and
  otherwise is inferred as a multi-line field when the control is materially
  taller than the form's shortest control and a single-line field otherwise —
  with the inference recorded as a residual so it is not mistaken for a fact;
- its labelling mode is the captured source of the control's accessible name, so
  a control the reference named with placeholder text is configured as
  placeholder-labelled rather than given a label row the reference never had.

A control the capture left unnamed still becomes a field, under a positional
label, with the missing name recorded as a residual.

## Verification
Import a bundle whose captured controls carry an accessible name, a control
type and a name source, and assert each derived field's label, key, type and
labelling mode against those captured values. Repeat with a control whose type
was not recorded and confirm the type is inferred from its height and a residual
records the inference; repeat with an unnamed control and confirm a field is
still produced with a residual naming the gap.