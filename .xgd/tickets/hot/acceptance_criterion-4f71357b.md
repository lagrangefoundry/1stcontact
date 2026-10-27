---
uid: acceptance_criterion-4f71357b
id: AC-2043
type: acceptance_criterion
title: check_fidelity against an uncaptured reference is refused by name before any
  gate or browser work
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:47:03.799757+00:00'
updated_at: '2026-10-27T21:13:41.547302+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
`check_fidelity` against a reference name that holds no capture is refused. The refusal comes from reading the bundle's `capture.json`, so the error is the bundle reader's plain error: `Bundle '<name>' has no capture.json.`. It names the missing reference. It is raised before any structural, coverage, perceptual or value gate runs and before any browser is used to take the actual picture.

Note: `check_fidelity`'s own not-found wording ("no reference called '<name>'. Use list_references…", a `PictureNotFoundError`) is not reached on this path, because the bundle reader throws first. The landed behaviour does not point the assistant at `list_references`.

## Verification
Call `check_fidelity` with a valid actual picture and a reference name that was never captured, using a browser driver that records every lease. Assert the call fails with an `Error` whose message is exactly `Bundle 'never-captured' has no capture.json.`, and that the driver recorded no lease or navigation.