---
uid: capability-18a822ac
id: CAP-65
type: capability
title: 1c Size-Aware Diffing
created_by: xgd
created_at: '2026-07-19T02:36:14.319634+00:00'
updated_at: '2026-08-07T15:27:39.223026+00:00'
completed_at: null
last_field_updated: status
status: deprecated
fields:
  name: size_aware_diffing
  uat_coverage: pass
  merged_into: capability-aa030c83
---

# 1c Size-Aware Diffing

Fidelity comparison of a captured site across the discrete viewport ladder
(mobile / tablet / desktop) rather than at a single fixed width.

Covers the shared `--size` viewport selector on the existing diff commands
(`values-diff` and pixel `diff`), the per-width reference screenshots that
capture persists so the pixel diff has a same-width reference, and — for
downstream stories — the standalone cross-size analysis command
(`responsive-diff`) that reads the same persisted ladder.

Reproduced from the bundle-ab9e0cb6 reconciliation (REQ-61). Related:
`1c Values-Diff Fidelity` (CAP-63) supplies the single-width value comparison
this generalizes across widths.



---

**ABSORBED 2026-08-05 (structural rebalance).** All stories previously under this
capability were reassigned to **1c Capture & Diff Fidelity** (`capability-aa030c83`).
This capability now holds zero stories and is retained only as a historical
pointer. It could not be set to `status: deprecated` in this run — see the
rebalance report for the blocking index defect.