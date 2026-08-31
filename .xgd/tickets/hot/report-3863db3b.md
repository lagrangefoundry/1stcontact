---
uid: report-3863db3b
id: REPORT-2818
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:49:33.892580+00:00'
updated_at: '2026-08-31T07:49:33.892580+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-52fc5c06.md` — AA (both added), intent/bookkeeping
  ticket (rule 2e). The two sides are byte-identical except that the incoming
  (free_coded) side adds one field the HEAD side never touched:
  `fields.chat_comment: comment-d49f31b0`. Incoming is therefore a strict
  superset, so 2e's "keep the superset" branch applies directly — no per-fact
  timeline lookup was needed, since no field was changed differently on the two
  sides. Resolved with `git checkout --theirs` + `git add --sparse` (path is
  outside the sparse-checkout cone, DOC-986 §2/§4.1).

The auto-enrichment metadata flagged this file as "intent unknown on one or both
sides — take the more recent commit by timestamp and flag for post-merge review."
That rule is moot here: with the incoming side a strict superset, taking it
loses nothing from the HEAD (`sync_working_to_main`) side, so both the
timestamp rule and the superset rule select the same content. Flagging for
post-merge review anyway, as the enrichment asked, though the delta is a single
bookkeeping field.

## Incoming changes preserved

- `.xgd/tickets/hot/request-52fc5c06.md`: confirmed. `git show
  0c846869706a68aac223a44a7d24eded6c6749e5 -- <path>` adds
  `chat_comment: comment-d49f31b0`; the staged diff vs HEAD is exactly that one
  added line and nothing else. No HEAD-side content was dropped — the ours stage
  contains no line absent from the resolved version.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here.
No code or UAT test files were involved in this conflict.
