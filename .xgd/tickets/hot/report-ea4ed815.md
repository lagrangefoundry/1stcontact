---
uid: report-ea4ed815
id: REPORT-5602
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T19:24:36.321547+00:00'
updated_at: '2026-09-29T19:24:36.321547+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — cfa2b27734 (bug-360c5a44)

- **Anchor**: report-377b581e
- **Candidate publish tip (apply_target)**: 9ac98712a708888db67f8aff21f22b16bd98094e
- **Cherry-picked commit**: `cfa2b27734` — `xgd(ticket): update bug bug-360c5a44` (xgd-working, 2026-09-09 14:31:17 -0700)
- **HEAD**: `37f1ec69c5` (unchanged; resolution is a net no-op, so finalize will skip the commit)
- **Retry count for this SHA**: 1 (first attempt; `prior_stage_failure` empty)
- **Result**: staged `--ours`, zero net change from HEAD, cherry-pick sequencer state intact.

## Conflict

Single file, `UU .xgd/tickets/hot/bug-360c5a44.md` (materialized in the working tree).
Enrichment gave "intent unknown on one or both sides → take the more recent commit by
timestamp", which is not decisive here and was not relied on.

Three-way from the index (`:1:` base = the picked commit's parent state, `:2:` ours,
`:3:` theirs). Bodies are byte-identical on all three sides; the entire divergence is
four frontmatter facts:

| fact | base (`:1:`) | ours (`:2:`) | theirs (`:3:`) |
|---|---|---|---|
| `updated_at` | 2026-09-09T00:17:24 | 2026-09-19T15:15:28 | 2026-09-09T21:31:17 |
| `completed_at` | null | 2026-09-14T10:29:01 | null |
| `status` | `bundled` | `free_and_reconciled` | `ready_to_reconcile` |
| `bundled_in` | `bundle-4efd33fe` | `bundle-8e1807f6` | *(removed)* |

Theirs is the combined status-flip + unbundle out of `bundle-4efd33fe`.

## Decision: `--ours`, all four facts

The decisive read was the incoming branch's own final state:

    git show xgd-working:.xgd/tickets/hot/bug-360c5a44.md

differs from `:2:` (ours) **only** in `updated_at` (15:15:41 vs 15:15:28 on 2026-09-19,
13 seconds apart). `status: free_and_reconciled`, `completed_at`, and
`bundled_in: bundle-8e1807f6` are identical. So ours already *is* xgd-working's latest
intent for this ticket — `--ours` preserves the developer's decision rather than
discarding it, and no incoming change is lost.

Theirs is a transient waypoint that **xgd-working itself superseded**, and every fact it
touched is restored by xgd-working's own later commits — no timestamp argument needed:

- `4f4589080d` (xgd-working, 09-11 11:53:54) re-bundles this ticket into
  `bundle-8e1807f6` — the same bundle ours carries — restoring `status: bundled` and
  `bundled_in`, i.e. reverting exactly the two facts `cfa2b27734` changed.
- `ff482d9dcc` (09-14) / `9563d602d4` (09-15) / `4de6b3df56` (09-19) then carry it to
  `completed_at` + `free_and_reconciled`, which is ours.

Note this ticket does **not** follow the `bundle-4efd33fe` vs `bundle-8e1807f6`
replay-adjudication shape recorded for earlier picks on this branch: here the two sides
never disagree about which bundle owns the ticket, because xgd-working moved to
`bundle-8e1807f6` on its own. No bundle-pair comparison was needed.

Why not let the naive 3-way merge stand: `status` diverged on theirs alone and
`bundled_in` on ours alone, so git's auto-merge would pair theirs' `ready_to_reconcile`
with ours' `bundle-8e1807f6` — a ticket "ready to reconcile" under a bundle that has
already reconciled. The four facts are one decision (which bundle owns this ticket and
what lifecycle stage it is at) and were adjudicated together.

## Forecast for upcoming picks on this ticket

The remaining xgd-working commits for `.xgd/tickets/hot/bug-360c5a44.md`, in pick order,
with expected outcome:

1. `4f4589080d` (09-11, re-bundle into `bundle-8e1807f6`) — result state is subsumed by
   ours; expect `--ours`, zero net change. May not conflict at all if its blob matches.
2. `ff482d9dcc` (09-14) — sets `completed_at`; ours already has it → `--ours`.
3. `9563d602d4` (09-15) — expect `--ours`.
4. `4de6b3df56` (09-19, `updated_at` 15:15:41) — this is xgd-working's tip for the path
   and the ONLY remaining fact ours lacks (a 13-second-newer `updated_at`). Do **not**
   blanket-`--ours` this one: incoming is the later genuine intent on `updated_at`, so
   take theirs for that field (it is the only difference).

## Commands run

    git checkout --ours -- .xgd/tickets/hot/bug-360c5a44.md
    git add --sparse -- .xgd/tickets/hot/bug-360c5a44.md

`git status --porcelain` is empty, `git diff --cached HEAD` is empty, and
`CHERRY_PICK_HEAD` still points at `cfa2b27734`. No `cherry-pick --continue/--skip` was
run — finalize owns that.
