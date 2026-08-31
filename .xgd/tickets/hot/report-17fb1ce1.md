---
uid: report-17fb1ce1
id: REPORT-2860
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:40:09.274256+00:00'
updated_at: '2026-08-31T08:40:09.274256+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-8a132869.md` — **AA (both added)**, intent/bookkeeping
  ticket (`request-*`), resolved under rule 2b / 2e "strict superset wins".
  Both sides are byte-identical except that the incoming (free_coded) side carries
  one additional frontmatter field, `fields.chat_comment: comment-28658562`. The
  incoming version is therefore a strict superset of HEAD's; no HEAD content is lost
  by taking it. Resolved with `git checkout --theirs` + `git add --sparse` (the path
  is under `.xgd/tickets/`, outside the sparse-checkout cone — DOC-986 §2/§4.1).

## Incoming changes preserved

- Incoming commit `762e21deebb6dedf39a4590bf5b602b9d3a82a58`
  ("xgd(ticket): update request request-8a132869") touches exactly one file and
  introduces it as 241 insertions. The staged blob is the incoming version verbatim,
  so 100% of the incoming diff is present. Confirmed specifically that the only
  substantive delta versus HEAD — `chat_comment: comment-28658562` at line 23 —
  appears in the staged content.
- No hunks were dropped. The BUG-1301 precedence exception was not invoked; no code
  or test files were involved in this conflict.

The cherry-pick sequencer state (`CHERRY_PICK_HEAD`) is untouched and still present
for `cherry_pick_finalize_resolution`.
