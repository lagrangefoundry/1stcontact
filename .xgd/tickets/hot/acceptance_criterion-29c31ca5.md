---
uid: acceptance_criterion-29c31ca5
id: AC-630
type: acceptance_criterion
title: Rendered-text-extent comparison suppresses non-differences and honours --tolerant
created_by: xgd
created_at: '2026-07-19T02:17:59.716255+00:00'
updated_at: '2026-07-23T11:45:06.979498+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The rendered-text-extent comparison produces no delta when the difference is not meaningful:
- a paired run whose extents differ by less than the ratio tolerance (e.g. ~0.4%, sub-pixel rounding) yields no rendered-text-extent delta;
- a run whose rendered extent is absent on either side (reference or reproduction) is skipped — never reported as a delta;
- under the `--tolerant` flag the ratio band widens, so a difference that fires by default (e.g. ~1.9%) is absorbed and yields no delta.

## Verification
Run the diff on three cases: (1) a ~0.4% extent difference on a long line; (2) a run measured on only one side; (3) a ~1.9% difference run both without and with `--tolerant`. Assert no rendered-text-extent delta in cases 1 and 2, a delta by default in case 3, and no delta for case 3 under `--tolerant`.