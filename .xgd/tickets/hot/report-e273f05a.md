---
uid: report-e273f05a
id: REPORT-2816
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:46:12.970054+00:00'
updated_at: '2026-08-31T07:46:12.970054+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-bc4c1408.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2e + 2b superset clause). Both sides are the same 69-line request ticket; the only difference is that the incoming (`free_coded`) side adds one frontmatter field, `chat_comment: comment-ac75ffef`. Incoming is a strict superset, so the incoming version was taken wholesale (`git checkout --theirs`, then `git add --sparse` — the path is outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1). No fields were invented, and no content present on either side was dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/request-bc4c1408.md`: the incoming commit `d0c3fb3f95cf64b2c6185acad513f0b7b7d1faf9` ("xgd(ticket): update request request-bc4c1408") contributes exactly one line relative to the HEAD-side version — `chat_comment: comment-ac75ffef`. That line is present in the staged blob (line 23 of the frontmatter), and the staged diff vs HEAD is `1 file changed, 1 insertion(+)`, matching the incoming intent exactly.

No code/implementation files were involved in this conflict, so no BUG-1301 precedence exception was needed and no hunks were dropped. Cherry-pick sequencer state (CHERRY_PICK_HEAD) left intact for `cherry_pick_finalize_resolution`.
