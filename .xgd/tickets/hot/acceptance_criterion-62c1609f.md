---
uid: acceptance_criterion-62c1609f
id: AC-1287
type: acceptance_criterion
title: A derived axis is reported for drill-down but excluded from the headline count
created_by: xgd
created_at: '2026-08-20T03:40:56.470660+00:00'
updated_at: '2026-08-20T07:00:16.017964+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-aaddb221
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A **derived** axis is reported but not counted. An element's absolute `position`
is the cumulative integral of the spacing and dimension deltas above it, so one
upstream cause drifts everything below it; counting those shadows would bury the
real list. Derived defects are therefore excluded from the headline count and
from the repair-class groups, and printed instead in their own drill-down block
labelled as the cumulative shadow of the counted causes and explicitly not
counted. The headline notes how many were set aside, so nothing disappears
silently.

Dimension axes — box `size` and the rendered text extent — are deliberately
**not** derived: they measure independent quantities rather than accumulating a
neighbour's error, and they stay counted.

## Verification

Collapse a cell set containing position deltas alongside spacing, size and
rendered-text-extent deltas. Assert the position rows are marked derived, are
absent from the headline count and from every repair-class group, and appear in
the derived drill-down block; assert the headline states how many derived rows
were set aside; and assert the size and rendered-text-extent rows remain counted.