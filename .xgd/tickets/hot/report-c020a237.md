---
uid: report-c020a237
id: REPORT-2768
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:46:25.919723+00:00'
updated_at: '2026-08-31T06:46:25.919723+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-d2980a95.md` — AA (both added), intent/bookkeeping ticket (`request-*`), rule 2e "one side is a strict superset". Both sides are byte-identical except the incoming side adds a single frontmatter field under `fields:`: `chat_comment: comment-05c9b8ab`. Incoming is therefore a strict superset with no competing fact — no per-fact timeline lookup was needed. Resolved with `git checkout --theirs`, staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-d2980a95.md`: the incoming commit `6045d68f` adds the file whole (206 insertions) because it is an add/add; the only content the incoming side carries that HEAD lacks is `fields.chat_comment: comment-05c9b8ab`. That line is present in the resolved file (line 24) and is the entire staged diff vs HEAD (`1 file changed, 1 insertion(+)`). No incoming content was discarded, and nothing was added that was not on the incoming side.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here. No code, test, or UAT files were involved in this conflict.
