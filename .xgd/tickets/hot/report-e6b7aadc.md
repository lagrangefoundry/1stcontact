---
uid: report-e6b7aadc
id: REPORT-2971
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:35:27.359115+00:00'
updated_at: '2026-08-31T15:35:27.359115+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — class **AA** (both added), intent/bookkeeping ticket
  (rule **2e**, strict-superset branch). Resolved by taking the incoming (`free_coded`) side:
  `git checkout --theirs` then `git add --sparse` (path is outside the sparse-checkout cone,
  DOC-986 §2/§4.1).

  The two sides are byte-identical apart from one addition on the incoming side: the
  `fields.chat_comment: comment-233e1afe` key, which the HEAD side never carried. Incoming is
  therefore a strict superset of HEAD — no field or section is changed differently on the two
  sides, so no timeline adjudication was needed. (The incoming blob also omits the trailing
  newline after the `## Origin` line; taking the incoming side verbatim preserves the developer's
  file exactly as authored.)

## Incoming changes preserved

- `.xgd/tickets/hot/request-51514090.md`: the resolved working-tree file hashes to
  `892df63295de8936c3e0cbd5c16d6881916a2ce4`, which is exactly stage 3 (theirs) of the unmerged
  index — i.e. the file content authored by cherry-picked commit
  `a342dac6d0a90d9376c4ddc41003a01c0031115f` ("xgd(ticket): update request request-51514090").
  That commit's diff for this path is a 95-line whole-file insertion, and every line of it is
  present in the resolution; `chat_comment: comment-233e1afe` is confirmed present at line 19.
  Nothing from the HEAD side was lost, since HEAD's content is a subset of the incoming content.

No hunks were dropped, so the BUG-1301 precedence exception did not apply. No code, test, or
config files were involved in this conflict.

Post-resolution state: `git status --porcelain` shows no UU/AA/DU/UD entries; the file is staged
as `M`. The cherry-pick sequencer state is intact (`CHERRY_PICK_HEAD` =
`a342dac6d0a90d9376c4ddc41003a01c0031115f`) for `cherry_pick_finalize_resolution`.
