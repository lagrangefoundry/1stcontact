---
uid: report-19d3b58d
id: REPORT-10982
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:06:43.284823+00:00'
updated_at: '2026-11-05T20:06:43.284823+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json`: UU, version-scalar conflict (`"version"` only). Ours = `0.2.117` (2de6a86da7, "chore(version): 0.2.117 for REQ-198", authored 2026-09-06, committed 2026-11-04). Theirs = `0.2.42` (5496ada1f1, authored 2026-09-01, committed 2026-11-02). Rule applied: the enrichment's "take the more recent commit by timestamp" rule. HEAD's version commit is newer by both author date and commit date, so ours (`0.2.117`) is kept. Taking theirs would also move the version back by 75 releases. Staged with `git add`, and no unmerged index entries remain. Flagged for post-merge review, as the enrichment rule requires.

## Incoming changes preserved

- In `package.json`, the incoming commit changed only the version line (0.2.41 -> 0.2.42). Nothing else in the file came from it.
- `git diff --stat 5496ada1f1 HEAD -- <every file the commit touches>` shows `package.json` as the only difference. All of the incoming commit's other changes (the assets-array removal) are already in HEAD from earlier integration, so no developer code was discarded.
- Note for finalize: because of this, the resolved index has no net diff against HEAD. The cherry-pick is effectively empty, so cherry_pick_finalize_resolution should expect an empty pick (skip or allow-empty).

## Arbitration of last resort (BUG-1460)

Did not apply. The timestamp rule from the enrichment settled the conflict directly.
