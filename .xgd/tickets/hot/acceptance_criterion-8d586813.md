---
uid: acceptance_criterion-8d586813
id: AC-2042
type: acceptance_criterion
title: A reference with no ladder member at the requested viewport falls back to its
  full-page shot and labels it as a fallback
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:47:02.450462+00:00'
updated_at: '2026-10-27T20:47:02.450462+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
When a captured reference has no ladder screenshot at the requested viewport, it is still usable. The reference picture falls back to the bundle's full-page shot instead of refusing. The picture's label states it is a fallback: it names the full-page shot and says no ladder member exists for that viewport (for example "no mobile ladder member"). A comparison against a fallback therefore reports it in the side's label in `compare` results. A bundle that holds no screenshot at all is refused as not found, and the error tells the assistant to list the references.

## Verification
Seed a bundle with only a full-page shot. Resolve the reference at `mobile`. Assert the full-page shot's pixels are returned and the label contains "no mobile ladder member".
