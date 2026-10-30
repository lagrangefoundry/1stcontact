---
uid: report-60d931b4
id: REPORT-4580
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:44:42.473559+00:00'
updated_at: '2026-09-20T23:44:42.473559+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`, STEP 2e). Outside the sparse-checkout cone, so the conflict
  existed only in the index with no working-tree markers; resolved and
  staged with `git add --sparse`.

  Merge base had `status: free_coded` / `updated_at: 2026-08-24T22:19:54`.
  The two sides advanced the SAME fact (`status`, plus its derived
  `updated_at` / `completed_at` / `last_field_updated`) differently:

  | side | status | updated_at |
  |---|---|---|
  | ours (HEAD `2b85aca40a`) | `free_and_reconciled` | 2026-08-31T19:19:34 |
  | theirs (CHERRY_PICK_HEAD `0431fed4c6`) | `ready_to_reconcile` | 2026-08-25T22:52:44 |

  Per 2e (same field changed differently on both sides → genuine intent
  conflict, later-positioned intent wins, per fact): took ours.
  Ledger replay via `xgd ticket history` on both revs shows ours is not
  merely later by wall clock but strictly DOWNSTREAM in the lifecycle —
  `draft → free_coding → free_coded → ready_to_reconcile → bundled →
  free_and_reconciled`. The incoming `ready_to_reconcile` intent has
  already been consumed and superseded on the HEAD side by
  `cbdfed2e2d` (`seed_local_overlay`, set `status: bundled` +
  `fields.bundled_in: bundle-78f4e2fe`) and then `01492336ad`
  (`status: free_and_reconciled`). Taking theirs would have rolled a
  terminal, completed ticket back to mid-reconciliation.

  HEAD-only `fields.bundled_in: bundle-78f4e2fe` (outside the conflict
  region) was preserved by the auto-merge and is intact. Body sections
  (Symptom / Root cause / Fix / Test plan) were untouched by both sides.

## Incoming changes preserved

No code/implementation files were in conflict — the only conflicted path
is a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` check
does not apply to any source file.

For the ticket itself: the incoming commit `0431fed4c6` changed only
`status` (`free_coded` → `ready_to_reconcile`) and its derived
`updated_at` / `last_field_updated`. It introduced no disjoint field,
section, or body edit that could be combined — so there is no incoming
fact discarded beyond the superseded `status` value itself, which the
HEAD-side ledger has already transited past. No BUG-1301 precedence
exception was invoked; no test function was deleted.

Resulting staged tree is byte-identical to HEAD (clean staged diff).
`git status --porcelain` is empty and `git ls-files -u` reports no
unmerged entries. `--continue` / `--skip` were NOT called;
CHERRY_PICK_HEAD (`0431fed4c6`) is left in place for the next step,
which will detect the clean staged diff and skip the commit.
