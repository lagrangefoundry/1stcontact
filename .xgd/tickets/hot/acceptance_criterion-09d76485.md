---
uid: acceptance_criterion-09d76485
id: AC-709
type: acceptance_criterion
title: Demand-driven recovery promotes only failing pinned sibling groups to flow
  and returns a valid L1 document
created_by: xgd
created_at: '2026-07-22T20:07:38.473705+00:00'
updated_at: '2026-07-23T06:35:03.951453+00:00'
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
Demand-driven structure recovery wraps only the pinned sibling groups that fail the
content-robustness check into flow stack containers — pinning the group's bounding
origin per captured width while flowing the interior (children keep their content but
lose their absolute geometry) — and leaves regions that already survive perturbation
absolute.

- The result reports which parent regions were promoted (their index paths).
- After recovery, the previously-failing region keeps the envelope under the same
  content perturbation (no overlap / clip).
- The returned document is a valid L1 document that satisfies the envelope validator; a
  recovery that would produce an invalid document is rejected rather than returned.

## Verification
On a folded fixture whose root pinned runs fail content-robustness, run recovery and
assert the root region is listed as promoted, the recovered document passes
content-robustness at every captured width, and the returned document validates. Assert
a region that already passes is not promoted.