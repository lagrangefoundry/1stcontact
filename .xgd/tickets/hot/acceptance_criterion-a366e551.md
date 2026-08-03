---
uid: acceptance_criterion-a366e551
id: AC-755
type: acceptance_criterion
title: A run whose own element paints its surface folds as a chip on the text leaf
  and contributes no card box
created_by: xgd
created_at: '2026-08-03T00:58:36.945625+00:00'
updated_at: '2026-08-03T01:27:46.561879+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A run whose **own** element paints the surface folds as a chip: the surface fill,
corner radius, shadow and border ride on the text leaf itself, and the run
contributes no card row — so the surface is painted once and never duplicated by a
box behind it. Two families qualify:

- a **saturated pill** — a radius reaching half the run's painted height (a
  `rounded-full` badge). An authored sentinel radius is clamped into the L1 length
  range, which paints the identical pill.
- a **padded control** — a run carrying an authored non-zero vertical padding, whose
  border box therefore already spans the painted surface. Horizontal padding alone
  does not qualify, and a run whose fill, gradient or accent rule was attributed from
  an ancestor stays on the card path, where those axes can be carried.

A modestly-rounded single-run card is deliberately not a chip: it keeps its card box
and its accent rule.

## Verification
Fold a capture containing a `rounded-full` badge and a padded button; assert each
folds to a text leaf carrying its own fill/radius/shadow/border, that no card box is
emitted behind it, and that the control's box equals its captured box at every width
(no doubled height, nothing bleeding past the viewport at the narrowest width).
Render and assert the surface is emitted on the text element. Assert a bare run gains
no chip surface, a modestly-rounded single-run card keeps its card box and accent
rule, and chip axes stay inside the L1 envelope.