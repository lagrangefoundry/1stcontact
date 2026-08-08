---
uid: acceptance_criterion-8378954a
id: AC-806
type: acceptance_criterion
title: A control leaf renders the module's element painted entirely by L1
created_by: xgd
created_at: '2026-08-06T01:32:20.057180+00:00'
updated_at: '2026-08-08T00:42:35.459193+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
An L1 `control` leaf names one leaf element that a mounted behavior module
declared, and the published page emits **that element** — its tag and its
behavioural attribute bundle (`type` / `name` / `required`, the id its label
points at, any placeholder) — carrying **L1's class, geometry and every paint
axis**. The look of a form field or a submit button is therefore authored in L1
exactly as any other node is, including on void elements that no presentation slot
could ever reach.

Three emitter properties make that inversion usable and safe:

- **A zero-look baseline.** User-agent control chrome — border, fill, padding,
  the control's own font and colour — is neutralised once by the emitter, before
  the authored axes, so a subtree that simply declines to set an axis is not
  painted through by the browser, and any axis the instance *did* author still
  wins. No module carries a reset stylesheet.
- **The placeholder follows the authored colour.** A placeholder-labelled control
  paints its placeholder in the colour L1 authored for that control, rather than
  the browser's grey, because the placeholder pseudo-element does not inherit it.
- **Inert degradation.** A control naming an element that no mounted module
  declares renders **nothing at all** — no element, no rule — rather than a bare,
  UA-styled input collecting a field nothing submits.

## Verification
Render an L1 subtree containing control nodes through a mounted behavior's
element roster and observe: each declared element emitted with its module
attributes intact and its class, geometry, fill, border, radius and text axes
coming from the L1 node. Assert the emitted rule carries the appearance-reset
declarations ahead of the authored ones, and that authoring a fill/border on the
control overrides the reset. Assert a placeholder-carrying control emits a
placeholder rule pointed at the control's own colour. Render the same subtree with
an empty roster (and with a control naming an undeclared element) and observe no
element and no rule for it, with the rest of the subtree unaffected.