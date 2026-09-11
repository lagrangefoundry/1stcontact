---
uid: report-a824c348
id: REPORT-3797
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T21:00:42.123305+00:00'
updated_at: '2026-09-10T21:00:42.123305+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — UU, intent/bookkeeping ticket (rule 2e; out of
  sparse cone, so the conflict existed only in the index, resolved with
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`).
  Resolved per-fact to the OURS (HEAD) side:
  - Body: byte-identical on both sides except a trailing newline at EOF (ours has one,
    theirs does not). No content difference. Kept ours.
  - `status`: ours `bundled`, theirs `ready_to_reconcile`. Same field, different values →
    per-fact timeline. Ours carries the later ticket timestamp
    (`updated_at: 2026-08-31T05:05:09Z` vs theirs `2026-08-30T20:37:44Z`) AND is strictly
    downstream in the request lifecycle: `ticket_types.yaml:204-205` records that a bundle
    absorbs children which then "point at this anchor via `bundled_in` and have
    status=bundled". Kept ours.
  - `fields.bundled_in: bundle-8eef3846`: present only on ours, a field theirs never
    touched → non-overlapping addition, kept (2e superset rule). Taking theirs would have
    reverted operator/pipeline-owned bundling state and orphaned the ticket from its
    bundle anchor.
  - `updated_at`: kept ours (later).
  - `last_field_updated`: `status` on both sides, no conflict.

  Neither side's commit carried a free-text operation narrative (both are the bare subject
  `xgd(ticket): update request request-b88b79fe`), and `xgd ticket history` cannot read the
  ticket in this worktree because the path is outside the sparse-checkout cone, so the
  per-fact judgement above was made from the two index stages plus the lifecycle definition
  in xgd's `ticket_types.yaml`.

## Incoming changes preserved

No code/implementation files were involved — the cherry-picked commit
`6531a2d1f4cc9417b55a492df0554428618ffd6a` touches exactly one file, this ticket, and its
entire content is a frontmatter status transition: `free_coded` → `ready_to_reconcile`
(plus the matching `updated_at` / `last_field_updated: status` bump).

That transition is PRESENT IN HEAD VIA A LATER ROUTE, not discarded: HEAD's `status: bundled`
with `bundled_in: bundle-8eef3846` is the state a ticket reaches only after
`ready_to_reconcile`, when a bundle anchor absorbs it. Re-applying the incoming value would
move the ticket backwards through its own lifecycle and drop the bundle back-reference.

The resolution therefore stages to no net diff vs HEAD (`git diff --cached HEAD` is empty).
Per STEP 4 this is the redundant-commit case, not the discarded-changes case, and is left
for the finalize step to skip. `git cherry-pick --continue/--skip/--quit/--abort` was NOT
called; CHERRY_PICK_HEAD is still present.

No hunks were dropped under the BUG-1301 precedence exception.
