---
uid: acceptance_criterion-c4727f6d
id: AC-855
type: acceptance_criterion
title: A failing run names its likely cause — capture-incomplete, reproduction-wrong
  or unexplained-disagreement — and the next step
created_by: xgd
created_at: '2026-08-06T03:13:21.605235+00:00'
updated_at: '2026-08-07T23:54:18.885847+00:00'
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
A run does not stop at pass/fail. It names the **likely cause** of the disagreement it
found, and the one next action that cause implies, so that "the capture is incomplete"
and "the reproduction is wrong" — which need different fixes — stop presenting
identically.

The named causes, with the evidence that selects each:
- **structural-failure** — the geometry gate itself failed; the reproduction is not
  geometrically faithful, and the next step is that gate's own residuals.
- **capture-incomplete** — the perceptual floor is breached **and** reference coverage
  is suspect. The diagnosis states that the value gates are not disagreeing but blind:
  they compare elements present in both manifests, so they cannot raise a delta against
  substance the capture never recorded. The next step names this as a capture defect,
  and where the value eye did report deltas it says they were measured against an
  impoverished reference and are not yet evidence.
- **reproduction-wrong** — the floor is breached, coverage is clean, and the value eye
  does see deltas. Both eyes agree and the reference is trustworthy, so the next step
  sends the operator to the value deltas, which name element by element what to fix.
- **unexplained-disagreement** — the floor is breached and nothing else sees it: the
  geometry gate passes, coverage is clean, and the value eye reports no delta. The
  diagnosis names it as a pixel that moved which no recorded value axis carries, and the
  next step is to add the missing axis rather than to patch the site.
- **pass** — the perceptual eye and the structural gate agree; where value deltas remain
  the next step points at the value verb as the sharp instrument for a page this close.

Coverage is consulted **before** the value-delta count: a run with both coverage findings
and value deltas is reported as capture-incomplete, naming both and saying which to work
first, because a delta count measured against an impoverished reference is not yet
evidence.

## Verification
Reconcile four runs — a failing geometry gate; a breach with coverage findings; a breach
with clean coverage and value deltas; a breach with clean coverage and no deltas — and
assert each returns its own named cause with a diagnosis and a next step distinguishing a
capture defect from a reproduction defect from a framework gap. Assert a breach carrying
both coverage findings and value deltas is named capture-incomplete rather than
reproduction-wrong.