---
uid: acceptance_criterion-4f71357b
id: AC-2043
type: acceptance_criterion
title: check_fidelity against an uncaptured reference is refused by name before any
  gate or browser work
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:47:03.799757+00:00'
updated_at: '2026-10-27T20:47:03.799757+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
`check_fidelity` against a reference name that holds no capture is refused with a not-found error. The error names the missing reference and directs the assistant to list the references. It is raised before any structural, coverage, perceptual or value gate runs and before any browser is used to take the actual picture.

## Verification
Call `check_fidelity` with a valid actual picture and a reference name that was never captured, using a browser driver that records every lease. Assert the call fails with a not-found error, the message contains the reference name and points to listing references, and the driver recorded no lease or navigation.
