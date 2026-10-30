---
uid: report-4d9db677
id: REPORT-4554
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T21:09:44.920703+00:00'
updated_at: '2026-09-20T21:09:44.920703+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-4fcbd354.md` — **UU**, intent/bookkeeping ticket (STEP 2e).
  Incoming commit `b636b4aa0c` ("xgd(ticket): update request request-4fcbd354") performs
  the lifecycle transition `ready_to_reconcile -> bundled` (dated 2026-08-24T02:10:41Z) and
  adds `fields.bundled_in: bundle-b3b7c399`. HEAD has already advanced two steps past that
  point to `free_and_reconciled` (2026-08-31T14:22:31Z, landed by `acb0d7985c`
  "xgd(reconciliation): terminal state complete").

  Per 2e: the conflicting hunk is the *same facts* on both sides (`status`, `updated_at`,
  `completed_at`, `last_field_updated`) changed differently — a genuine intent conflict, so
  the later-positioned intent wins per fact. `xgd ticket history request-4fcbd354` confirms
  the lifecycle order `draft -> free_coding -> free_coded -> ready_to_reconcile -> bundled ->
  free_and_reconciled`, making HEAD strictly later on every conflicting fact. Kept HEAD's
  `status: free_and_reconciled` and its non-null `completed_at`; taking the incoming side
  would have walked the ticket backwards and cleared a real completion timestamp.

  The file was outside the sparse-checkout cone, so it was staged with `git add --sparse`
  (DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-4fcbd354.md`: the incoming commit's only additive,
  non-competing change — `fields.bundled_in: bundle-b3b7c399` — merged cleanly as context
  (it was already present in HEAD) and is confirmed present in the staged blob. The
  incoming `status: bundled` transition is intentionally not preserved as the file's final
  value: it is a strictly earlier point on the same lifecycle field that HEAD has already
  passed through, not discarded developer work. No code files were in conflict; no hunk was
  dropped under the BUG-1301 precedence exception.

## Staging state

`git status --porcelain` is empty: the resolution is byte-identical to HEAD, so this
cherry-pick contributes no net change. CHERRY_PICK_HEAD (`b636b4aa0c`) left intact for the
finalize step, which will detect the clean staged diff and skip the commit.
