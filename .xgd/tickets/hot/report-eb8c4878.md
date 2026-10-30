---
uid: report-eb8c4878
id: REPORT-4520
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:29:32.298847+00:00'
updated_at: '2026-09-20T19:29:32.298847+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — UU, intent/bookkeeping ticket (`request-*`, STEP 2e).
  Single conflicted hunk: HEAD carries `bundled_in: bundle-b3b7c399`; the incoming side's
  parent did not have that key. This is not the same fact changed two ways — it is a field
  present on one side only, so both sides' facts were combined (superset kept), not a
  winner-take-all pick.

  The incoming commit `50fc10b759` touches this file with exactly one insertion:
  `+ chat_comment: comment-869ded75`. That key is already present in HEAD (line 24) — the
  conflict arose only because HEAD's extra adjacent `bundled_in` line collided with the
  insertion context. Resolution keeps both keys.

  Lifecycle fields merged cleanly in HEAD's favour before the conflict (HEAD
  `status: free_and_reconciled`, `updated_at: 2026-08-31`, `completed_at` set; incoming
  `status: ready_to_reconcile`, `updated_at: 2026-08-23`). Taking the incoming side there
  would have regressed the ticket's lifecycle backwards and dropped `bundled_in`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-a03967f2.md` — verified against
  `git show 50fc10b759dfe262320a64390f16b71fc285399a -- <path>`: the commit's sole change is
  `chat_comment: comment-869ded75`, and `git show :0:<path>` confirms that key is present in
  the staged result (line 24) alongside `bundled_in: bundle-b3b7c399` (line 25). No conflict
  markers remain.

No hunks were dropped under the BUG-1301 precedence exception; no code or UAT files were
involved in this conflict.

Note: the staged resolution is byte-identical to HEAD for this path (the incoming insertion
was already integrated), so the finalize step will see an empty staged diff. Per STEP 4 this
step staged and exited without calling `--skip`/`--continue`; `CHERRY_PICK_HEAD` is intact.
