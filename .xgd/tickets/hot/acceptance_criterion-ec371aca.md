---
uid: acceptance_criterion-ec371aca
id: AC-811
type: acceptance_criterion
title: An L2 preset supplies a vetted default look for an uncaptured contact form
created_by: xgd
created_at: '2026-08-06T01:33:52.802713+00:00'
updated_at: '2026-08-09T05:40:50.818365+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Deleting a module's stylesheet must not cost a site authored **without** a
capture its default look. The framework therefore publishes an **L2 preset** — a
vetted default design returned as ordinary L1 — that a caller drops straight into
a contact form's presentation slot: a stacked column of fields with a submit
button, each field a control node bound by its own submission name and the button
bound as the submit control, carrying fill, border, radius, padding, measure and
height, a visible label run above a visibly-labelled field and none above a
placeholder-labelled one, plus a vetted hover and focus treatment.

The preset lays itself out from sizing and gaps rather than pinned per-width
geometry, because it has no capture behind it. Its few design constants — text
colour, field fill, border colour, corner radius, field height, vertical rhythm,
and the submit button's fill and label colour — are overridable by the caller,
and the result is plain L1 the author may edit, extend or discard entirely. The
default look is a **starting point, not a ceiling**.

## Verification
Build a preset subtree for a multi-field configuration (mixing visible and
placeholder labelling, including a textarea) and assert: it is a valid L1 subtree
inside the envelope; it binds one control per field name plus the submit, so
validating an instance that mounts it reports no control-binding violation; a
visibly-labelled field gains a label run and a placeholder-labelled one does not;
the textarea is given a taller measure than a single-line field. Override each
design constant and observe the returned subtree carries the overridden values.
Render a form mounting the preset and observe a complete, laid-out form with no
module stylesheet involved.