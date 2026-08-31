---
uid: report-7c527f7d
id: REPORT-2753
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:26:20.409039+00:00'
updated_at: '2026-08-31T06:26:20.409039+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-40def173.md` — **AA** (both added), intent/bookkeeping ticket (STEP 2e). Ours = `sync_working_to_main` (sync from xgd-working 597681c166c6, post-watermark); theirs = `xgd(ticket): update request request-40def173` (272161aa2e21d61137857289355ea4283479f532). The two blobs differ by exactly one line: incoming adds `chat_comment: comment-c8b9e9b9` under `fields:`. Incoming is a strict superset — the ours side never touched that field and changed nothing else. Applied the 2e superset rule: took the incoming version whole (`git checkout --theirs` + `git add --sparse`). No timeline arbitration needed; there is no same-field disagreement.

  Path is under `.xgd/tickets/`, outside the sparse-checkout cone on this reconcile branch (DOC-986 §2/§4.1), so `--sparse` was used for staging.

## Incoming changes preserved

- `.xgd/tickets/hot/request-40def173.md`: verified by `git diff --cached 272161aa 2e21d61137857289355ea4283479f532 -- <path>` returning empty — the staged blob is byte-identical to the incoming commit's version. The incoming addition (`chat_comment: comment-c8b9e9b9`) is present in the resolution.

No code/implementation files were in conflict. No hunks were dropped; the BUG-1301 precedence exception was not invoked. No test functions were deleted.

`git status --porcelain` shows no remaining conflict classes — the file stands as `M ` (staged modification). CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`.
