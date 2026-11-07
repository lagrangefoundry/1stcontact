---
uid: acceptance_criterion-04d9d9ce
id: AC-2356
type: acceptance_criterion
title: The published channel's cache policy is asserted equal to the Worker's own
  published cache value
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T21:10:02.866468+00:00'
updated_at: '2026-11-07T21:10:02.866468+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

Given a site key, the smoke check asserts that the published site's index answers with the
published cache policy (`cache-control: public, max-age=60` today), and fails naming the policy it
saw and the one it expected otherwise.

The expected value is **the serving Worker's own published cache value**, not an independent
restatement: the check runs outside the Worker bundle and cannot import it, so the value is stated
on both sides of that deployment boundary and the two are pinned equal, so a change to the Worker's
policy that is not mirrored in the check is caught rather than reported as a live-origin failure
later.

## Verification

Read the published cache value the serving Worker declares and run the check against an origin whose
published index answers with exactly that value: the check passes. Serve the index with any other
cache policy: the check fails, naming both the seen and the expected policy.
