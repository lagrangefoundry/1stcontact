---
uid: report-ba2e64df
id: REPORT-3621
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:16:02.950601+00:00'
updated_at: '2026-09-10T01:16:02.950601+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**; `bundle-*`, not a matrix-defining spec ticket). Resolved by
  taking the **ours/HEAD** side in full, then `git add --sparse`.

  Both sides changed the *same two facts* and nothing else — there were no
  disjoint edits to combine:

  | fact | base | incoming (`eb58654`, 2026-08-26 10:36 -0700) | ours (`8e07e60`, 2026-08-31 07:23 -0700) |
  |---|---|---|---|
  | `status` | `ready_to_reconcile` | `reconciling` | `free_and_reconciled` |
  | `updated_at` | 2026-08-25T23:30 | 2026-08-26T17:36 | 2026-08-31T14:23 |

  The incoming diff is 2 insertions / 2 deletions and touches only those two
  lines. Ours additionally sets `completed_at`, `last_field_updated: result`,
  collapses `fields.commits` to a single reconciled entry carrying
  `main_sha: eef7a8b4…`, and records `fields.orphan_commits`. Every fact the
  incoming side touches is therefore also owned by the ours side, so rule 2e's
  per-fact timeline test applies to both facts and resolves the same way.

  Timeline: ours is **5 days later** than incoming. Per the auto-enrichment
  rule for this file ("intent unknown on one or both sides — take the more
  recent commit by timestamp and flag for post-merge review") and per 2e's
  later-positioned-intent rule, ours wins on both facts. `xgd working-timeline`
  was not runnable here because neither side carries a resolvable
  `intent_uid` — that is precisely the case the enrichment fallback covers.

  Taking the incoming side would have regressed a completed bundle from
  `free_and_reconciled` back to the intermediate `reconciling` and dropped
  `completed_at`, `main_sha`, and the whole `orphan_commits` record.

## Incoming changes preserved

Yes — via a further-advanced route, not discarded (STEP 3's redundant-vs-
discarded distinction; BUG-1109/BUG-1122).

The incoming commit's sole intent is to advance this bundle's lifecycle from
`ready_to_reconcile` to `reconciling`. HEAD's own history for this file
already passed through exactly that state and then moved past it:

- `4b7f40157d` (2026-08-30) `xgd(ticket): seed_local_overlay bundle bundle-b3b7c399` — introduces `status: reconciling`
- `a0b52c93a6` (2026-08-31) `xgd(ticket): update bundle bundle-b3b7c399` — moves off `reconciling`
- `8e07e6015d` (2026-08-31 07:23) — lands `status: free_and_reconciled` + `completed_at` + `orphan_commits`

`free_and_reconciled` is downstream of `reconciling` in the bundle lifecycle,
so the incoming state transition is subsumed by HEAD rather than lost. No
developer code was discarded: the incoming commit touches one bookkeeping
ticket and no code, test, or config file.

No hunks were dropped under the BUG-1301 precedence exception — it did not
apply to this conflict.

## Staging state

- `git ls-files -u` → 0 entries; no conflict-class lines remain in
  `git status --porcelain`.
- `CHERRY_PICK_HEAD` still present at `eb58654345c1afcca4372c3d62e2b324278ff1d9`
  — no `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
- The staged diff vs HEAD is **empty**, since ours already equals HEAD. Per
  STEP 4 this is expected and is not a failure: `--skip` was deliberately not
  called; the finalize step will detect the clean staged diff and skip the
  commit.

## Post-merge review flag

Flagged per the enrichment rule (intent unknown on both sides): the incoming
`reconciling` transition for `BUNDLE-20` was superseded by this branch's own
completed reconcile. If BUNDLE-20 is later found to need re-reconciling, that
must be driven from its current `free_and_reconciled` state, not by replaying
this commit.
