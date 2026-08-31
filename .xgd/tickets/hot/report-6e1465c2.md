---
uid: report-6e1465c2
id: REPORT-2842
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:17:48.315669+00:00'
updated_at: '2026-08-31T08:17:48.315669+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-64864801.md` — class **AA** (both added), intent/bookkeeping ticket (rule **2e**). Both sides carry the same `xgd(ticket): update request request-64864801` subject; the only difference between the two blobs is that the incoming (theirs, `40725f4e`) side adds one frontmatter field, `chat_comment: comment-b335cb8a`. Incoming is a strict superset of ours (`49bc8748`) — every other byte is identical — so 2e's superset rule applies and the incoming version was taken verbatim (`git checkout --theirs`, then `git add --sparse`; the path is outside the sparse-checkout cone per DOC-986 §2/§4.1). No timeline lookup was needed: no field is changed differently on the two sides, so there is no competing fact to arbitrate.

## Incoming changes preserved

- `.xgd/tickets/hot/request-64864801.md`: preserved in full. The staged blob is byte-identical to the incoming stage-3 blob `40725f4ef0685592f0d6578d01f4440b2f078b07`; the incoming commit's addition (`chat_comment: comment-b335cb8a`, line 28) is present in the resolved file, and the staged diff vs HEAD is exactly that one added line. Nothing from the ours side was dropped — ours contained no content absent from the incoming version.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No code/implementation files were involved in this conflict.
