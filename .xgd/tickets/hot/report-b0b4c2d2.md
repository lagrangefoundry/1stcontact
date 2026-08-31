---
uid: report-b0b4c2d2
id: REPORT-2798
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:23:50.401975+00:00'
updated_at: '2026-08-31T07:23:50.401975+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-6a8efe0f.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`).
  Rules applied: **2b** (AA, one side strictly a superset → keep the superset, incoming wins) reinforced by
  **2e** (intent ticket, incoming only added a field the other side never touched → keep the superset).
  Resolved by `git checkout --theirs`, staged with `git add --sparse` (path is under `.xgd/tickets/`, outside
  the sparse-checkout cone on reconcile branches, DOC-986 §2/§4.1).

  The two sides were byte-identical except for a single line: the incoming side carries
  `fields.chat_comment: comment-a65908b7`, which the HEAD side lacks. No competing fact, no overlapping
  field edit, so the per-fact timeline rule was not needed — this is a pure strict-superset case.
  Staged diff vs HEAD is `1 file changed, 1 insertion(+)`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-6a8efe0f.md` — **fully preserved.** The incoming commit
  `d2b77ac6fc3bdeb42811caafd75753d46ecd7147` ("xgd(ticket): update request request-6a8efe0f") adds this file
  in its entirety (91 insertions, whole-file add on that side). The resolved working-tree content is
  byte-identical to the incoming (`:3:`) blob, so every line of the incoming diff is present in the result.
  Verified directly: `fields.chat_comment: comment-a65908b7` — the only content the incoming side had that
  HEAD did not — is present at line 24 of the resolved file.

No hunks were dropped. The BUG-1301 precedence exception was not invoked and no test files were involved.
No code/implementation files were in conflict; the sole conflict was a bookkeeping ticket.
