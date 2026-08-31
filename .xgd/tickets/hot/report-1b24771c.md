---
uid: report-1b24771c
id: REPORT-2723
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:53:08.601361+00:00'
updated_at: '2026-08-31T05:53:08.601361+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-6c2b1cf4.md` — **AA** (both added), intent/bookkeeping
  ticket (`request-*`), resolved under rule **2e** (strict-superset case).
  Both sides created the same 146-line REQ-97 request ticket. A full diff of
  `:2:` (ours) vs `:3:` (theirs) shows exactly one difference: the incoming side
  carries an additional frontmatter field `chat_comment: comment-431315b0` under
  `fields:`. Incoming is a strict superset — it appended a field the ours side
  never touched, and no field, section, or paragraph is changed differently
  between the sides. No timeline arbitration was needed (no competing fact), so
  `xgd working-timeline` was not consulted. Resolved with
  `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-6c2b1cf4.md` — preserved in full. The staged blob is
  `c4d4aed747`, byte-identical to the blob the incoming commit
  `337b7a6dcb06aa2014b983ab372609ea20a3de1f` introduced for this path (the
  commit adds the file as a 146-line new file at blob `c4d4aed747`). The staged
  diff vs HEAD is the single line `+  chat_comment: comment-431315b0`, which is
  precisely the incoming-only content. Nothing from either side was dropped: the
  ours side contributed no content absent from the incoming version.

No code/implementation files were in conflict. No hunks were dropped, so the
BUG-1301 precedence exception did not apply. No UAT test functions were touched.
