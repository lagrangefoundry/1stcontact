---
uid: report-e963e74d
id: REPORT-3333
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:33:59.749890+00:00'
updated_at: '2026-09-02T19:33:59.749890+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — UU, intent/bookkeeping ticket (rule 2e).
  Single conflict hunk, confined to lifecycle frontmatter (`updated_at`,
  `completed_at`, `status`). Both sides changed the SAME facts, so the per-fact
  timeline rule applies, not a whole-file pick.
  - HEAD (`02c0d39001`, 2026-08-31 07:22:44 -0700): `status: free_and_reconciled`,
    `completed_at: '2026-08-31T14:22:44...'`.
  - Incoming (`95ffc177ff`, 2026-08-23 18:15:24 -0700): `status: ready_to_reconcile`,
    `completed_at: null`.
  - `xgd ticket history request-23fd6e61` shows HEAD's timeline already ran
    `ready_to_reconcile` → `reconciling` (`80cdf17160`, 08-20) → `bundled`
    (`e0ffd3bfb4`, 08-30) → `free_and_reconciled` (`02c0d39001`, 08-31). The
    incoming commit re-queues the request to `ready_to_reconcile`, a state HEAD
    has already passed through and moved beyond.
  - Resolution: kept the HEAD side for these facts (`git checkout --ours`,
    `git add --sparse`; the path is outside the sparse-checkout cone). No other
    field or body section differs between the two sides, so no combining was
    needed and nothing from the incoming side was dropped beyond the three
    superseded scalars.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so STEP 3's code-preservation check has no code target.

The incoming commit's only content is the lifecycle status transition. Its
intent is present in HEAD via a different route rather than discarded: HEAD
carries the request strictly downstream of `ready_to_reconcile` (through
`reconciling` and `bundled` to `free_and_reconciled`). Taking the incoming side
would have reverted an operator-only status and re-opened an already-completed
request.

The staged tree therefore nets to no diff vs HEAD. Per STEP 4 this is the
redundant-commit case (not a discard), so the file is staged and no
`--skip`/`--continue` was issued; the cherry-pick sequencer state
(CHERRY_PICK_HEAD = 95ffc177ff2251089cb173a560162260633b4a9d) is left intact for
`cherry_pick_finalize_resolution`.

No hunks were dropped under the BUG-1301 precedence exception.
