---
uid: acceptance_criterion-18fdf9ca
id: AC-1066
type: acceptance_criterion
title: What the assistant did during a turn is shown in the pane alongside what it
  said
created_by: xgd
created_at: '2026-08-10T08:46:59.874701+00:00'
updated_at: '2026-09-14T07:52:25.329412+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

When a turn reports activity beyond speaking — the assistant acting on the site — that
activity is displayed in the pane's own area for it, alongside the reply, so the
operator can see what was done and not only what was said. A turn that reports no
activity leaves that area with nothing in it rather than showing an empty frame's worth
of noise.

The change signal a turn carries when one of those actions moved the site is not
activity and is not displayed. The pane tells the two apart: it acts on the signal and
stops there, so the signal produces no message, no entry in the activity area, and
nothing in the conversation that is replayed the next time the site is opened.

## Verification

Run a turn that reports activity and confirm it appears in the pane's activity area,
distinct from the assistant's message text, and that the reply is still shown. Run a turn
that reports none and confirm no activity is displayed.

Run a turn whose stream carries change signals in among its activity and confirm that
afterwards the conversation holds only the operator's message and the assistant's reply —
no extra message, and no signal left in the activity area.
