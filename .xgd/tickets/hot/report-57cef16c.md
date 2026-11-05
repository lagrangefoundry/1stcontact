---
uid: report-57cef16c
id: REPORT-11000
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:20:18.337518+00:00'
updated_at: '2026-11-05T20:20:18.337518+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` (UU, config/version scalar): conflict confined to the `"version"` field. HEAD = `0.2.117` (2de6a86da7 "chore(version): 0.2.117 for REQ-198 [FREE-CODED]", committed 2026-11-04). Incoming 60f849732c = `0.2.65 -> 0.2.66` (committed 2026-11-02, authored 2026-09-04). Applied the enrichment rule (take the more recent commit by timestamp) → kept HEAD `0.2.117`. Flagged for post-merge review per that rule.

## Incoming changes preserved

60f849732c touches only `package.json` (1 line: version bump to 0.2.66). That bump is not in the resolved file: it is stale, and applying it would roll the version back from 0.2.117 to 0.2.66. The REQ-180 guard work described in the commit message is not in this commit's diff, so no developer code is lost. The resolution has no net diff vs HEAD; the cherry-pick will be empty when finalized.

## Arbitration of last resort (BUG-1460)

- `package.json`: resolved at tier 1 (most recent intent). HEAD's later REQ-198 version commit supersedes the incoming REQ-180 version bump; both are FREE-CODED, and HEAD's is later on the timeline. Dropped side: incoming (`0.2.66`). Evidence: commit timestamps above, and the version can only move forward (0.2.117 > 0.2.66).
