---
uid: report-3c8e71d6
id: REPORT-1978
type: report
title: 'Sync-main review: reconcile-REQ-138'
created_by: xgd
created_at: '2026-08-13T02:21:34.751854+00:00'
updated_at: '2026-08-13T02:21:34.751854+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-REQ-138
---

{
  "findings": []
}

Verification performed (read-only):

1. Conflict markers: `git grep -E '^(<{7} |>{7} |={7}$)'` over *.py *.yaml *.yml
   *.ts *.js *.css returned exit 1 (no matches).

2. Semantic reverts of main's intent: main contributed ZERO source changes in
   this window. Old merge-base f4396e65a05fafbb8aac80f2f265517c1148fc56 ->
   main a0d9efd0063bd3c94b4e8cb1f60b18a88a0f6403 is 11 commits, all
   ticket-metadata only. Non-ticket diff is empty. With no main-side source
   intent in the window, there is no deletion/rename/value-change/move to
   revert.

3. Main's 5 changed ticket files (comment-05c9b8ab.md, comment-a5255c4d.md,
   report-eda89d48.md, report-f53a5001.md, request-1ff09fab.md) were each
   diffed a0d9efd00..HEAD: all byte-identical. No main-side deletions existed.

4. Over-aggressive conflict resolution: none possible. The branch's source
   diff is byte-identical pre- and post-rebase --
   `git diff <old-mb> 14908db01 -- apps/ tests/ packages/` and
   `git diff a0d9efd00 HEAD -- apps/ tests/ packages/` both hash to
   1926353002b33d0ff4575852a559261ab0ef8346. Conflict Files list was empty.

5. Branch deletions: `git diff --name-status main...HEAD` shows only A/M
   entries, no D.

6. Briefing note: the two test files marked "(deleted)" in the briefing --
   tests/reconciliation-copy-edit-live-preview.test.ts and
   tests/test_UAT_FC_REQ-138_live_preview.test.ts -- never existed on main
   (`git log main -- <paths>` is empty). They were created on-branch by
   857129bf9 and 65f16ff36. This is a briefing direction artifact, NOT a
   resurrection of a main-side deletion.

7. Integration coherence: editor.js imports previewScale and previewVarFor
   from page-style.js; both are exported there, along with previewSizePx.
   Internal helpers pxOf (line 198) and PREVIEW_MIN_PX/PREVIEW_MAX_PX
   (lines 26-27) are present. builder.css additions are self-contained.

Verdict: pass.
