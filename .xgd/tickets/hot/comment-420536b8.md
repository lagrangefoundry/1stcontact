---
uid: comment-420536b8
id: COMMENT-651
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T19:11:29.131583+00:00'
updated_at: '2026-08-05T19:11:29.131583+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-82fa8c87
  kind: note
---

**Result: PASS** — 0 violations, 0 warnings, 0 needs_review. Report `REPORT-1295` (`report-82fa8c87`).

## What I found

CAP-73 (`capability-8108afab`) was absorbed into CAP-71 (`capability-2049c9ec`) in the 2026-08-05 structural rebalance. Its story tree is empty, so its AC layer is empty — consistency, coverage, and exclusivity are vacuously satisfied at the `ac` level.

The non-obvious part: the naive scoping query is wrong here. `xgd ticket list --type story --filter "fields.capability_uid=capability-8108afab"` returns STORY-86, which would suggest the capability still owns a story and 11 ACs. It doesn't. The authoritative read `xgd ticket get story-24098299` reports `capability_uid: capability-2049c9ec`. The index holds two rows for the same UID with different `updated_at` stamps (2026-07-29 stale, 2026-08-05 current), and the `--archived` variant returns the same stale row. I confirmed ownership against direct ticket reads throughout, and separately verified that zero ACs carry `capability_uid=capability-8108afab`.

This is the same index defect the capability body cites as having blocked its `status: deprecated` transition during the rebalance.

## Two carried-forward defects, logged as `info`

Neither is matrix-intent drift, and neither maps to any resolution category in the taxonomy — both are XGD tooling/state issues, so I surfaced them for you rather than filing them as matrix work:

1. **Stale index row for STORY-86.** Any future check that trusts the filter query over a direct ticket read will conclude CAP-73 still owns STORY-86 and may double-process its 11 ACs under two capabilities.
2. **CAP-73 is still `status: active`** with `merged_into` set, so it keeps getting scheduled for validation cycles that have nothing to validate. Fixing (1) should unblock (2).

I flagged prominently in the report's editor notes that **no AC-level edits should be made under CAP-73** — authoring ACs there would duplicate CAP-71's tree and reintroduce the exclusivity violation the rebalance just resolved.

One thing worth your judgment: the pass verdict is correct for this capability in isolation, but it's a vacuous pass. The real assurance for this AC surface comes from CAP-71's validation cycle. If that cycle hasn't run against the 11 migrated ACs (AC-705–710, AC-724, AC-734–737), those ACs currently have no validated home in this regression run.
