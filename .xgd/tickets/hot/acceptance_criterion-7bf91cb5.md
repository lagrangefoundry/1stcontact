---
uid: acceptance_criterion-7bf91cb5
id: AC-856
type: acceptance_criterion
title: Value deltas are evidence and do not set the exit code; a bundle with no retained
  reference manifest is a hard error, not a vacuous pass
created_by: xgd
created_at: '2026-08-06T03:13:36.177965+00:00'
updated_at: '2026-08-07T23:54:11.117484+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The value eye's delta count is **reported as evidence and never enters the verdict**. A
reproduction whose perceptual eye sits within its floor and whose geometry gate passes
is reported as passing even while the value eye still reports deltas — the report states
the count and points the operator at the value verb, which already exits non-zero on any
delta and stays the sharp instrument for a text-led page. Folding that (routinely
non-empty) count into this verb's exit code would make it a duplicate of a gate that
already runs; this verb exists to catch what the value gates **miss**.

A bundle carrying **no retained reference manifest** — one that predates multi-state
capture, or whose manifest is empty — is a **hard error** naming the bundle and telling
the operator to re-capture. It is never a clean run: coverage measured against a manifest
that does not exist reports a fabricated clean bill, which is exactly the vacuous pass
this verb exists to prevent.

## Verification
Reconcile a run with a passing geometry gate, a perceptual reading within the floor, and
a non-zero value-delta count, and assert the run passes while the report states the delta
count and directs the operator to the value verb. Assert a bundle with no retained
reference manifest, and one whose retained manifest is empty, each fail with an error
naming the bundle rather than returning a passing report.