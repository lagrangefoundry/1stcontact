---
uid: report-01ee34ba
id: REPORT-2819
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:51:08.249546+00:00'
updated_at: '2026-08-31T07:51:08.249546+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-84af044b.md` — class **AA** (both added; path is outside the sparse-checkout cone, so the conflict existed only in the index with no working-tree markers). Kind is `request` → intent/bookkeeping ticket, so STEP 2e applies, combined with 2b's superset test.

  Blob-level diff of stage 2 (ours) vs stage 3 (theirs) shows a single difference: the incoming side adds `fields.chat_comment: comment-aa24aec5`. Every other byte — frontmatter scalars, `fields.commits`, `version`, `merged_at_commit`, `result`, and the entire body — is byte-identical. The incoming side is therefore a **strict superset** of ours: it appends one field that the HEAD side never touched. No field is changed differently on the two sides, so the timeline rule (`xgd working-timeline`) was not needed — there is no competing fact to arbitrate.

  Resolution: `git checkout --theirs -- <path>` then `git add --sparse -- <path>`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-84af044b.md`: the incoming commit `ca357554df41d7c1f2dc553058384c2be9b77819` (`xgd(ticket): update request request-84af044b`) touches only this file. Its sole net effect relative to our side is the addition of `chat_comment: comment-aa24aec5` under `fields:`. That line is present at line 24 of the resolved file, and `git diff --cached HEAD` for this path shows exactly one hunk — the `+  chat_comment: comment-aa24aec5` insertion — and nothing else. The incoming intent is fully preserved; nothing from the HEAD side was dropped.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here. No code, test, or config files were in conflict — this was the only conflicted path in the tree.
