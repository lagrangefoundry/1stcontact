---
uid: acceptance_criterion-b04cbb23
id: AC-1140
type: acceptance_criterion
title: Only a parameter the operator actually changed overrides the box; every untouched
  axis keeps its opening dressing
created_by: xgd
created_at: '2026-08-13T01:09:17.138934+00:00'
updated_at: '2026-09-10T23:17:21.279163+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Changing one parameter changes **one thing about the box**. No other axis moves:
the run's colour, its family, the paint behind it and every parameter the
operator has not touched keep exactly the value the opening dressing gave them.

Opening the dialog and touching nothing therefore leaves the box dressed
precisely as the page's rendering dressed it. This is not a restatement of the
opening dressing — it is the claim that driving the sheet cannot quietly undo it.
The two sources legitimately disagree: the opening dressing is read from the page
as rendered, which is what a run *ends up* looking like once it has inherited
from around it, while a parameter's value is only what that run itself
**overrode**. A run that inherits its weight while declaring none is heavy on the
page and reports a default in the sheet, so a box re-dressed from the whole
parameter set would visibly lighten the moment it appeared — and would keep
lightening on the first unrelated change. The box must keep the rendered weight
until the operator changes the weight.

The rule does not soften where a control does exist. The run's colour has a row
in the sheet (AC-1279), and an untouched colour is still governed by the same
claim: the box takes its colour from the page as rendered, so staging a colour
the operator did not stage cannot happen, and no other axis is re-derived when
the colour row is the one that moves.

## Verification

Open the dialog over a run of copy and record every aspect of the box's
presentation before touching anything. Change one parameter and assert that
exactly that aspect changed and every other one is byte-identical to what was
recorded — including the run's **family**, which the sheet has no control for at
all, its **tracking**, which is opening dressing rather than anything the sheet
exposes, the paint behind the words, and its **colour**, which does have a row in
the sheet and must still hold the value the render gave it while that row is
untouched. Open the dialog over a run whose weight is inherited from around it
rather than declared on the run itself, touch nothing, and assert the box
previews the weight the page renders rather than the value the sheet reports;
then change an unrelated parameter and assert the weight still has not moved.
