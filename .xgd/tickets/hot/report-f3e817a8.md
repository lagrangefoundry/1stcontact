---
uid: report-f3e817a8
id: REPORT-4429
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:44:50.786220+00:00'
updated_at: '2026-09-19T12:44:50.786220+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` (BUG-42) — **UU**, index-only (path is
  outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1, so
  no working-tree markers ever materialized). Class **2e** (intent/bookkeeping
  ticket — a `bug-*`, not a matrix-defining spec ticket). Resolved with
  `git checkout --ours` + `git add --sparse`.

  Per-fact analysis against the merge base (`db7db2f`):

  | fact | base | ours (`a67d870`) | theirs (`b42fd97`) | taken |
  |---|---|---|---|---|
  | `status` | `free_coded` | `bundled` | `ready_to_reconcile` | ours |
  | `completed_at` | null | `2026-09-14T10:29:07` | null (untouched) | ours (superset) |
  | `fields.bundled_in` | absent | `bundle-8e1807f6` | absent (untouched) | ours (superset) |
  | `last_field_updated` | `story_points` | `status` | `status` | identical — no conflict |
  | `updated_at` | `2026-09-01T21:16:53` | `2026-09-16T01:48:34` | `2026-09-01T21:20:15` | ours |
  | body (Symptom / Root cause / Fix / Test plan) | — | unchanged | unchanged | identical — no composition needed |

  Only two facts are genuinely contested (`status`, `updated_at`); the rest are
  either one-sided additions or byte-identical. Both sides are one-sided only in
  ours' favour, so there is nothing on the incoming side to combine in.

  Timeline rule for the contested facts: ours is later on every measure. Ours'
  latest commit touching this path is `3be3f50` (2026-09-17 13:23:48 -0700,
  `xgd(ticket): seed_local_overlay bug bug-034bf955`); the incoming commit
  `05ef55a` is 2026-09-01 14:20:15 -0700. Ours' `updated_at` is 2026-09-16, the
  incoming's is 2026-09-01. This also matches the auto-enrichment rule supplied
  for this file ("take the more recent commit by timestamp").

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path
is a bookkeeping ticket — so STEP 3's code-discard guard has no code to check.
Recording the reasoning for the one incoming edit anyway:

The incoming commit's entire change to this file is the lifecycle advance
`status: free_coded -> ready_to_reconcile` (plus the corresponding `updated_at`
and `last_field_updated: status` bumps). That literal string is not in the
resolved file, and its absence is **supersession, not discard**:

- `ready_to_reconcile` is the state a ticket occupies *while waiting to be
  picked up by a reconcile bundle*. Ours has already moved past it to `bundled`,
  with `fields.bundled_in: bundle-8e1807f6` — which is this very reconcile run's
  own intent. The incoming waypoint is therefore not missing from HEAD; HEAD is
  the downstream consequence of it, and names this bundle as the consumer.
- `last_field_updated: status` — the incoming commit's own statement of *which
  fact it was editing* — is present verbatim in the resolution, because ours
  edited the same field afterwards and landed on the same marker.
- Restoring the incoming value would be a regression, not a preservation: it
  would un-bundle a ticket that this run has already bundled and completed
  (`completed_at: 2026-09-14`), and would drop `bundled_in`.

No hunk was dropped under the BUG-1301 precedence exception; no test function
exists on either side of this conflict, so 2f was never in play.

## Net effect

The resolution is byte-identical to HEAD, so the staged diff vs HEAD is empty
(`git status --porcelain` is silent, `git ls-files -u` is empty, the path is
staged clean at stage 0 as blob `a67d870`). This is the expected
already-landed-by-another-route case (BUG-1109/BUG-1122), not a discard — STEP
3's distinguishing test resolves to "present in HEAD via a later refinement",
as detailed above. Per STEP 4 no `--skip` was issued; the finalize step will
detect the clean staged diff and skip the commit itself. `CHERRY_PICK_HEAD`
(`05ef55a7131bf216484c604a70412c0101d9e49a`) is untouched and still present.
