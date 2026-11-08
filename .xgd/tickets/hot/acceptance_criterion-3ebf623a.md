---
uid: acceptance_criterion-3ebf623a
id: AC-2440
type: acceptance_criterion
title: Escape and scrim click dismiss a panel unless turned off, and an inside click
  never does
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:50.566749+00:00'
updated_at: '2026-11-08T13:25:15.353332+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
With a panel open, pressing Escape closes it and a click on the scrim (outside the panel) closes it. A click inside the panel, including on its fields, leaves it open. A panel declaring `dismissOnEscape: false` stays open on Escape, and one declaring `dismissOnBackdrop: false` stays open on a scrim click. Both dismissals are on when the fields are absent.

## Verification
In a DOM environment, open a default panel. Dispatch Escape and assert it closes. Reopen it, click inside and assert it stays open, then click the scrim and assert it closes. Repeat with each dismissal turned off and assert the panel remains open.