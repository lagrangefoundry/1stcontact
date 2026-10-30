---
uid: report-c42cdfc0
id: REPORT-6311
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:45:48.171524+00:00'
updated_at: '2026-10-05T03:45:48.171524+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — intent/bookkeeping ticket (2e), `--ours`, zero net change from HEAD `7ef32ed2d6`.
  Pick `d975830c32` (2026-09-01 12:28:25 -0700). Base `2a59e08e19` (== previous pick's theirs) / ours `4b1ec9bd2a` (== HEAD) / theirs `4df13eff0a`.
  Theirs' whole delta: `updated_at` → 19:28:25 and `last_field_updated: story_points`. The value of `story_points` is unchanged (5), and ours already carries `story_points: 5`. Ours' `updated_at` (09-19) is later, and ours' lifecycle (`free_and_reconciled`, `completed_at`, `bundled_in: bundle-8e1807f6`) is the later state. Ours is a superset.
  Same blobs and outcome as reconcile-BUNDLE-29 (scope 83).

## Incoming changes preserved

No code files. The ticket's only incoming change is bookkeeping metadata, superseded by ours.

Forecast: `cb4ece9296` (retitle, which ours already has) and `d22ba37c40` (→ready_to_reconcile) are `--ours`. The xgd-working tip `3f23e96b90` (09-19) is the exception: it wins `updated_at` only.
