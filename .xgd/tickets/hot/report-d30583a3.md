---
uid: report-d30583a3
id: REPORT-10976
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:01:58.366773+00:00'
updated_at: '2026-11-05T20:01:58.366773+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` (UU, root config/manifest; scalar `version` field). Rule applied: enrichment resolution rule ("intent unknown, take the more recent commit by timestamp, flag for post-merge review"). HEAD side `2de6a86da7` "chore(version): 0.2.117 for REQ-198" was authored 2026-09-06. Incoming `a3f315890b` "chore: bump version to 0.2.38 for REQ-156" was authored 2026-09-01. Kept HEAD's `"version": "0.2.117"`. No other hunks were in conflict. **Flagged for post-merge review** as the rule requires.

## Incoming changes preserved

The incoming commit's only change is the version scalar (`package.json | 2 +-`), and that change is intentionally not kept. It is a stale, older version bump: 0.2.38 < 0.2.117, and taking it would move the package version backwards. The resolved tree therefore has no net diff vs HEAD. The cherry-pick is left paused with CHERRY_PICK_HEAD present, ready for cherry_pick_finalize_resolution, which will most likely need to skip it as empty.

## Arbitration of last resort (BUG-1460)

- `package.json`: the incoming hunk was dropped. Resolved by the enrichment's explicit timestamp rule, backed by the tier-1 evidence that a later version-bump commit (REQ-198, 0.2.117) supersedes the incoming REQ-156 bump to 0.2.38. The incoming side was dropped.
