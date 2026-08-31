---
uid: report-02ef7d98
id: REPORT-2699
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:28:28.427014+00:00'
updated_at: '2026-08-31T05:28:28.427014+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-1ff09fab.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2e).
  Both sides added the same 135-line REQ-138 request ticket. A blob-level diff of stage 2
  (`f87ea619`) vs stage 3 (`a74f33b1`) shows the two sides are byte-identical except for one
  added frontmatter field on the incoming side:

  ```
  +  chat_comment: comment-a5255c4d
  ```

  Incoming is therefore a **strict superset** — it only adds a field the HEAD side never
  touched. Rule 2e ("one side is a strict superset ... keep the superset") applies directly;
  no per-fact timeline lookup was needed because no field is set differently on the two sides.
  Resolved with `git checkout --theirs` + `git add --sparse` (the path is outside the
  sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1, so the conflict existed only
  in the index).

## Incoming changes preserved

- Incoming commit `a980361ba9d7f1faa460d1f03613a800aea1b46f`
  (_xgd(ticket): update request request-1ff09fab_) touches exactly one file, the conflicted
  ticket, as a whole-file add. `git diff --cached` on the resolved path confirms the staged
  content is bit-for-bit the incoming blob `a74f33b1`: the sole delta vs HEAD is the
  `chat_comment: comment-a5255c4d` field the incoming commit authored. Nothing from the
  incoming side was discarded, and nothing from the HEAD side was lost (HEAD's content is a
  subset of the incoming content).

No code/implementation files were in conflict. No hunks were dropped, so the BUG-1301
precedence exception was not invoked. No UAT test functions were touched.

Staging verified with `git status --porcelain`: no UU/AA/DU/UD lines remain; the file shows
as `M ` (staged modification). The in-progress cherry-pick state (CHERRY_PICK_HEAD) was left
intact for `cherry_pick_finalize_resolution`.
