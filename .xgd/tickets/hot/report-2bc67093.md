---
uid: report-2bc67093
id: REPORT-11044
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:44:55.179848+00:00'
updated_at: '2026-11-05T20:44:55.179848+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` (UU, version scalar). Rule: the enrichment rule ("intent unknown, take the more recent commit by timestamp and flag for post-merge review") plus STEP 3h tier 1. Kept HEAD's `"version": "0.2.117"`.
  - HEAD: 2de6a86da7 `chore(version): 0.2.117 for REQ-198 [FREE-CODED]`, authored 2026-09-06T12:46:19-07:00
  - Incoming: 19bcd2a8ae (cherry-picked from e65655396f) `chore(version): 0.2.110 for REQ-192 [FREE-CODED]`, authored 2026-09-06T12:20:09-07:00
  - Both sides are free_coded. HEAD was authored later and already includes the bumps from 0.2.110 through 0.2.117 (0.2.116 and 0.2.117 for REQ-198). Taking incoming would downgrade the version by 7 patch levels.
  - FLAG for post-merge review, as the enrichment rule requires.

## Incoming changes preserved

The incoming commit's only change is the single line `"version": "0.2.110"`. It is intentionally absent. It is not a careless discard: the commit is stale on this branch, because later free_coded commits (0.2.116 and 0.2.117 for REQ-198) supersede it. The staged result matches HEAD (no net diff). Per STEP 4 and BUG-1460, that alone is not a reason to fail. The finalize step should treat this pick as empty.

## Arbitration of last resort (BUG-1460)

- `package.json`: tier 1 (most recent intent). REQ-198's 0.2.117 bump was authored after REQ-192's 0.2.110 bump, and every bump in between is already in HEAD. Version numbers only go up. Dropped the incoming side (0.2.110).
