---
uid: report-b4b02b4a
id: REPORT-2863
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:44:00.117055+00:00'
updated_at: '2026-08-31T08:44:00.117055+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-11efc10f.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`). Rule **2e** applied: the incoming side is a **strict superset** of HEAD — the only difference between the two blobs is one added frontmatter field, `fields.chat_comment: comment-6b8f7701`. Every other byte (frontmatter, body, implementation narrative) is identical. Kept the superset (incoming). Staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

No content was invented; no field was changed beyond what the incoming side already declared.

## Incoming changes preserved

- `.xgd/tickets/hot/request-11efc10f.md` — verified: `git diff --cached 36d3e3dfadf0493a0c8fb85983e484c1ce07b779 -- <path>` is **empty**, i.e. the staged blob is byte-identical to the incoming commit's version. The incoming commit `36d3e3d` ("xgd(ticket): update request request-11efc10f") touched only this file, and its sole substantive change (`chat_comment: comment-6b8f7701`) is present in the resolution.

No hunks were dropped; the BUG-1301 precedence exception did not need to be invoked. No code files, UAT tests, or spec tickets were involved in this conflict.

Post-resolution `git status --porcelain` shows no conflict classes (UU/AA/DU/UD/AU/UA); the file is staged as `M`. The in-progress cherry-pick state (CHERRY_PICK_HEAD) was left untouched for `cherry_pick_finalize_resolution`.
