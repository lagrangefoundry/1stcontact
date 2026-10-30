---
uid: report-54caa27e
id: REPORT-6312
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:46:33.493835+00:00'
updated_at: '2026-10-05T03:46:33.493835+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — intent/bookkeeping ticket (2e), `--ours`, zero net change from HEAD `7ef32ed2d6`.
  Pick `cb4ece9296` (2026-09-01 12:30:16 -0700). Base `4df13eff0a` (== previous pick's theirs) / ours `4b1ec9bd2a` (== HEAD) / theirs `50c1365929`.
  Theirs' delta: a retitle to "Test suite: 27 failures + 30 collection errors — … eleven UATs superseded by later work", plus `updated_at` and `last_field_updated: title`. Ours already carries that exact title. Ours' `updated_at` (09-19) and lifecycle (`free_and_reconciled`, `completed_at`, `bundled_in`) are later. Ours is a superset.

## Incoming changes preserved

No code files. The incoming title change is present verbatim in the resolved file.

Forecast: `d22ba37c40` (free_coded→ready_to_reconcile) is `--ours`. The xgd-working tip `3f23e96b90` (09-19) is the exception: it wins `updated_at` only.
