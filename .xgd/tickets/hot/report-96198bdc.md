---
uid: report-96198bdc
id: REPORT-10968
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T19:55:04.773294+00:00'
updated_at: '2026-11-05T19:55:04.773294+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` (UU, version scalar, root manifest): I kept HEAD's `"version": "0.2.117"` and dropped the incoming `"0.2.29"`. This follows the enrichment rule ("take the more recent commit by timestamp; flag for post-merge review"), backed by STEP 3h.
  - Ours: 2de6a86da7 `chore(version): 0.2.117 for REQ-198 [FREE-CODED]`, authored 2026-09-06.
  - Theirs: 2f5546be19 (cherry-picked from deaf3f98c4) `chore: bump version to 0.2.29 [FREE-CODED]`, authored 2026-08-31.

## Incoming changes preserved

None. The incoming commit's only change is the one-line version bump to 0.2.29. Applying it would move the project version backwards from 0.2.117 to 0.2.29, a regression of 88 releases. The incoming commit is stale on this branch: a later free-coded commit (0.2.117, REQ-198) has already superseded it. The resolved tree has no diff against HEAD, so the cherry-pick is empty. Finalize should treat it as empty or skip it. I did not call --skip.

## Arbitration of last resort (BUG-1460)

- `package.json`, resolved by tier 1 (most recent intent) and the timestamp rule from the enrichment. Both sides are free-coded version bumps to the same scalar. The HEAD side (0.2.117, REQ-198) is later by author date (2026-09-06 vs 2026-08-31) and by version number, and it supersedes the incoming 0.2.29 bump. I dropped the incoming side, so the resolution nets to no diff against HEAD. Flagged for post-merge review per the enrichment rule.
