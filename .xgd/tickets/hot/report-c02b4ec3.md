---
uid: report-c02b4ec3
id: REPORT-2868
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:49:23.296624+00:00'
updated_at: '2026-08-31T08:49:23.296624+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-94c792c0.md` — class **AA** (both added), intent/bookkeeping
  ticket (§2e). Ours = `sync_working_to_main` (sync from xgd-working d3562e3b8285,
  post-watermark); theirs = `xgd(ticket): update request request-94c792c0` (d2fe355d).
  The two sides are identical except that the incoming side carries one additional
  field, `fields.chat_comment: comment-af70ec94`. Incoming is therefore a **strict
  superset** of ours, so the superset rule applies directly — no per-fact timeline
  arbitration was needed, since no field is set differently on the two sides.
  Resolved with `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-94c792c0.md` — confirmed. The incoming commit d2fe355d
  contributes stage-3 blob b262c081; the staged resolution is byte-identical to that
  blob. The staged diff vs HEAD is exactly the incoming commit's sole net change:

      +  chat_comment: comment-af70ec94

  No hunks were dropped. No BUG-1301 precedence exception was invoked. No code or
  test files were involved in this conflict.
