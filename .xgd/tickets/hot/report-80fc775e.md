---
uid: report-80fc775e
id: REPORT-2791
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:14:21.735773+00:00'
updated_at: '2026-08-31T07:14:21.735773+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-a8ccd0dd.md` — **AA** (both added), intent/bookkeeping
  ticket (`request-*`). Rules 2b + 2e: incoming side is a **strict superset** of
  HEAD's version, so the superset was kept via `git checkout --theirs` +
  `git add --sparse`.

  Diff between the two index stages (`:2` `5810367e` vs `:3` `b1318e22`) is a
  single insertion, zero deletions:

  ```
  @@ fields:
     merged_at_commit: 345dcb7685ac02043945a8c4cd65ef3aba7b1fa7
  +  chat_comment: comment-5d147d68
   result: pass
  ```

  Every other byte of the 13,956-byte HEAD version is identical to the incoming
  13,989-byte version. No field was changed differently on the two sides, so the
  per-fact timeline rule in 2e was not engaged — there is no competing fact.
  `fields.intent_uid` / `story_uid` / `capability_uid` were not touched, and no
  content absent from either side was invented.

## Incoming changes preserved

Incoming commit: `ef4df279e6a39c5697f9404fd3f7ec1445a260c9`
("xgd(ticket): update request request-a8ccd0dd", Martin Westhead,
Sun Aug 23 13:05:50 2026 -0700) — a 242-line file addition touching only this
one path.

Verified in the resolved working-tree file:

- `chat_comment: comment-5d147d68` present at line 24, inside the `fields:` block
  (the incoming commit's only delta relative to HEAD's version).
- Zero conflict markers remain (`<<<<<<<` / `>>>>>>>` count is 0).
- Staged diff vs HEAD is exactly `1 file changed, 1 insertion(+)`, matching the
  incoming intent precisely — nothing from the developer's side was discarded.

No hunks were dropped. The BUG-1301 precedence exception was not invoked, and no
test functions were involved in this conflict.

Cherry-pick sequencer state left untouched: `CHERRY_PICK_HEAD` still resolves to
`ef4df279e6a39c5697f9404fd3f7ec1445a260c9` for `cherry_pick_finalize_resolution`.
