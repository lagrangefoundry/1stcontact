---
uid: report-b2375fc0
id: REPORT-11006
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:25:02.208146+00:00'
updated_at: '2026-11-05T20:25:02.208146+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — config file (2g), single scalar conflict on `"version"`. Resolved to HEAD's `0.2.117` (ours). Staged with `git add`.

## Incoming changes preserved

In this cherry-pick, incoming commit f8a4acb626 ("feat(people): style the User tab…") touches only `package.json`, and its only change is a version bump `0.2.73 -> 0.2.76`. That change was intentionally NOT kept (see arbitration below). The result is therefore identical to HEAD (empty cherry-pick); the finalize step should treat it as empty (skip / allow-empty).

## Arbitration of last resort (BUG-1460)

- File: `package.json` (`"version"` scalar)
- Tier: 1 (most recent intent) — consistent with the enrichment rule "take the more recent commit by timestamp".
- Evidence: HEAD's side comes from 2de6a86da7 "chore(version): 0.2.117 for REQ-198 [FREE-CODED]" (Sun Sep 6 2026 12:46 -0700), which is later than the incoming commit (Sat Sep 5 2026 13:32 -0700). Applying the incoming value would downgrade the package version from 0.2.117 to 0.2.76, so the incoming bump is stale on this branch.
- Dropped: the incoming side (`0.2.76`). Flagged for post-merge review per the enrichment rule.
