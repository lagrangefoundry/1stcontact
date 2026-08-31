---
uid: report-9e1f01a7
id: REPORT-2750
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:23:43.897033+00:00'
updated_at: '2026-08-31T06:23:43.897033+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-ed6ba145.md` — AA (both added), intent/bookkeeping ticket
  (rule 2b + 2e). Both sides added a 187/188-line `request` ticket whose content is
  identical except that the incoming (free_coded, commit `81ab25d6`) side carries one
  extra frontmatter field under `fields:`: `chat_comment: comment-a3f23a36`.
  Incoming is a strict superset of HEAD — no field, section, or paragraph exists on the
  HEAD side that incoming lacks — so the superset was kept: `git checkout --theirs` then
  `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).
  No timeline lookup was needed: there is no per-fact disagreement, only an addition.

## Incoming changes preserved

- `.xgd/tickets/hot/request-ed6ba145.md`: the incoming commit `81ab25d6` adds the file in
  full (189 insertions). The staged index entry is blob `f8e6f795196b88c46e38e5a2e9cdf8fd946f8f80`,
  which is byte-identical to the incoming side's blob, so 100% of the incoming content is
  present. The staged diff vs HEAD is the single added line
  `    chat_comment: comment-a3f23a36`, which is precisely the incoming-only content.
  Nothing from the HEAD side was discarded (verified by `diff` of the two stage blobs:
  the only difference is the one added line, `23a24`, with no deletions).

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code, test, or spec-ticket files were in conflict. Cherry-pick sequencer state
(`CHERRY_PICK_HEAD`) left intact for `cherry_pick_finalize_resolution`.
