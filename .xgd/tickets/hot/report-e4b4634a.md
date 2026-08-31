---
uid: report-e4b4634a
id: REPORT-2778
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:57:33.001672+00:00'
updated_at: '2026-08-31T06:57:33.001672+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-87dc7504.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2e), outside the sparse-checkout cone so the conflict existed index-only with no working-tree markers (DOC-986 §2/§4.1). Resolved with `git checkout --theirs` + `git add --sparse`.

  Rationale: diffing stage 2 (ours, `sync_working_to_main` from xgd-working d3562e3b8285, post-watermark) against stage 3 (incoming free_coded `xgd(ticket): update request request-87dc7504`, 31997aa9) showed the two sides are identical except that incoming adds a single frontmatter field:

  ```
  +  chat_comment: comment-9f886115
  ```

  Incoming is therefore a **strict superset** — no field is changed differently on the two sides, so 2e's per-fact timeline rule was not needed. Kept the superset. The enrichment note's "intent unknown on one side, take the more recent commit and flag for review" fallback also points the same way, and is moot here since nothing from the ours side is lost.

## Incoming changes preserved

- `.xgd/tickets/hot/request-87dc7504.md`: confirmed. `git show 31997aa9 -- <file>` is a whole-file add whose only delta versus the ours side is the `chat_comment: comment-9f886115` line; that line is present at line 35 of the staged blob, and `git diff --cached HEAD` for this file is exactly `1 insertion(+)`. Every other line of the incoming version is byte-identical to the ours side and is retained.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict.
