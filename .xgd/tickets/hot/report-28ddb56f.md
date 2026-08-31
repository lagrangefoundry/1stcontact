---
uid: report-28ddb56f
id: REPORT-2760
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:36:16.458270+00:00'
updated_at: '2026-08-31T06:36:16.458270+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-847b979f.md` — class **AA** (both added), intent/bookkeeping ticket (rule **2e**, superset branch). Both sides are byte-identical apart from one field the incoming (`free_coded`) side adds under `fields:`:

  ```
  +  chat_comment: comment-98856643
  ```

  Incoming is a strict superset of HEAD — it appends a field HEAD never touched, and changes no field HEAD sets. No same-field divergence, so no `xgd working-timeline` per-fact tiebreak was needed. Kept the superset: `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1 — conflict lived in the index only, no working-tree markers).

## Incoming changes preserved

- `.xgd/tickets/hot/request-847b979f.md` — the staged blob is byte-identical to the incoming commit's blob `5cdfcc9f9f4f2f0585f2a8d7b9d7200a41a4f05f` (verified with `git diff :<path> 5cdfcc9f` → empty). The incoming commit `99d2bcafb14ba565fcd3b0835c21aea1a862f9e0` touched only this file, and its sole net change vs HEAD (`chat_comment: comment-98856643`) is present in the resolution. Nothing from HEAD was dropped: HEAD's version is a proper subset of the staged content.

No code/implementation files were in conflict. No hunks were dropped; the BUG-1301 precedence exception did not apply. Cherry-pick sequencer state (`CHERRY_PICK_HEAD`) left intact for `cherry_pick_finalize_resolution`.
