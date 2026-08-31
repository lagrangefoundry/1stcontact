---
uid: report-df4195ae
id: REPORT-2851
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:29:05.463322+00:00'
updated_at: '2026-08-31T08:29:05.463322+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-66e4c630.md` — AA (both added), intent/bookkeeping ticket.
  Rule 2b + 2e (strict superset): the two sides are byte-identical except that the
  incoming (free_coded, commit 8b12f4ce93c4270dcd201ffac10e609d01d9ec2d) side appends
  one frontmatter field, `chat_comment: comment-64cb2bfb`, under `fields:`. HEAD's side
  contains nothing the incoming side lacks, so no per-fact timeline arbitration was
  needed — no field or section was changed differently on the two sides. Resolved with
  `git checkout --theirs` then `git add --sparse` (path is outside the sparse-checkout
  cone on this reconcile branch, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-66e4c630.md`: confirmed. The incoming commit adds the file
  in full (199 insertions); its only divergence from HEAD's version is the single line
  `chat_comment: comment-64cb2bfb`. The staged diff against HEAD is exactly that one
  added line, so the incoming content is present in its entirety and nothing from
  HEAD's side was dropped.

No code/implementation files were in conflict. No hunks were dropped, so the BUG-1301
precedence exception did not apply. No test functions were touched. The cherry-pick
sequencer state (CHERRY_PICK_HEAD) is left intact for
cherry_pick_finalize_resolution.
