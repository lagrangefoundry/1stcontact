---
uid: acceptance_criterion-f7dc24d1
id: AC-751
type: acceptance_criterion
title: A capture shoots a viewport-height probe re-sampling one ladder width at a
  second height, without adding a ladder width
created_by: xgd
created_at: '2026-08-03T00:25:19.153830+00:00'
updated_at: '2026-08-03T00:25:19.153830+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
In addition to the responsive width ladder, a capture records a probe projection
that re-samples one of the ladder's widths at a DIFFERENT viewport height, so
that height response can be observed as a finite difference (a change in height
at constant width) rather than inferred from a width correlation.

The probe does not extend the ladder: the set of sampled widths, and the
screenshots taken per width, are exactly the ladder's. The probe appears as an
additional projection at an already-sampled width, distinguishable from the
ladder sample it re-shoots by its viewport height.

## Verification
Capture a page and inspect the persisted multi-viewport value set: it contains a
projection whose width equals one of the ladder widths and whose recorded
viewport height differs from that ladder entry's, while the ladder's own set of
widths and its screenshots are unchanged from a capture taken without the probe.
