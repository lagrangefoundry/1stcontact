---
uid: acceptance_criterion-11047c96
id: AC-865
type: acceptance_criterion
title: The check spans every site tree, including the scratch tree where capture-derived
  sites land, and attributes each violation to the tree and site that caused it
created_by: xgd
created_at: '2026-08-06T03:30:40.978869+00:00'
updated_at: '2026-08-10T08:15:48.834460+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8685be2d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A licence obligation attaches to the font, not to the site that happens to
reference it, so the check is project-wide: both the tracked site tree and the
scratch tree where reproduction sites and their capture-derived fonts land are
scanned in one run, and a violation in either fails the run. Each violation
identifies the tree and the site it came from, so an operator can tell an authored
site's problem from a reproduction's.

## Verification
Build a project holding one site in the tracked tree serving a recorded font and
one site in the scratch tree serving an unrecorded family. Run the check and
assert: overall failure, and the reported violation is attributed to the scratch
tree and to that site. Assert the tracked site's recorded font raises nothing.