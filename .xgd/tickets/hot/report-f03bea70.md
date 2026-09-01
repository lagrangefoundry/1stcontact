---
uid: report-f03bea70
id: REPORT-3199
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:27:49.870561+00:00'
updated_at: '2026-09-01T04:27:49.870561+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (rule 2e).
  Sparse-excluded path, staged with `git add --sparse`.
  The conflict is confined to one frontmatter block (`updated_at`,
  `last_field_updated`, `status`); the incoming commit 486ef694e0 touches
  nothing else in the file.

  - Base (:1): `status: free_coded`, `updated_at 2026-08-24T01:50:12Z`
  - Incoming (486ef694e0, authored 2026-08-25 15:52): `status: ready_to_reconcile`,
    `updated_at 2026-08-25T22:52:42Z`
  - Ours (HEAD 7a8d0abd29, `seed_local_overlay`): `status: bundled`,
    `updated_at 2026-08-26T17:36:27Z`

  Same fact (`status`) advanced differently on each side, so the per-fact
  timeline rule applies. HEAD's value is both later by timestamp
  (2026-08-26 vs 2026-08-25) and strictly downstream in the ticket lifecycle
  (`free_coded` -> `ready_to_reconcile` -> `bundled`). Corroborating: the
  non-conflicted region of the merged file already carries
  `fields.bundled_in: bundle-78f4e2fe`, which is coherent only with
  `status: bundled` — taking the incoming value would have left the ticket
  claiming membership in a bundle while reporting a pre-bundle status.

  Resolution: kept HEAD's block for that fact. No content was invented, and no
  `intent_uid` / `story_uid` / `capability_uid` field was touched.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted file is a
bookkeeping ticket.

The incoming commit's only intent is "advance BUG-36's status past
`free_coded`". That intent is present in HEAD via a later route: HEAD already
sits at `bundled`, which is downstream of the incoming `ready_to_reconcile`.
This is the redundant-commit case (BUG-1109/BUG-1122), not a discard: the
incoming change is superseded by a strictly later transition already in HEAD,
rather than absent from it.

Consequently the resolved file is byte-identical to HEAD (`git diff HEAD --
.xgd/tickets/hot/bug-db356ff8.md` is empty) and the staged diff for this
cherry-pick is empty. Per the workflow instructions this was staged and left
for `cherry_pick_finalize_resolution` to skip; `--skip` was not invoked here
and `CHERRY_PICK_HEAD` is intact.

No hunks were dropped under the BUG-1301 precedence exception.
