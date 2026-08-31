---
uid: report-9e99c308
id: REPORT-2702
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:31:14.072879+00:00'
updated_at: '2026-08-31T05:31:14.072879+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-d41fd017.md` — AA (both added), intent/bookkeeping ticket (2e) resolved via the strict-superset rule. Both sides are byte-identical except that the incoming (free_coded) side adds one frontmatter field, `fields.chat_comment: comment-f6f1c1b0`, which the HEAD side never carried. Incoming is therefore a strict superset; resolved with `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1). No timeline lookup was needed — there is no competing fact, so 2e's superset branch applies rather than its genuine-conflict branch.

## Incoming changes preserved

- `.xgd/tickets/hot/request-d41fd017.md` — the incoming commit `41bb28d9` ("xgd(ticket): update request request-d41fd017") adds this file whole (400 lines). Diffing the two index stages shows a single delta: `+  chat_comment: comment-f6f1c1b0`. The staged blob is `5a518087d6` — bit-identical to the incoming stage-3 blob — so 100% of the incoming content is present, including that field. Nothing from the HEAD side was lost, since HEAD's version is a proper subset.
- No hunks were dropped; the BUG-1301 precedence exception was not invoked.
- No code/implementation files were conflicted in this attempt.
