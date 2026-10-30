---
uid: report-cf43c312
id: REPORT-5309
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:58:48.230879+00:00'
updated_at: '2026-09-28T06:58:48.230879+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, file class **2e** (intent/bookkeeping
  ticket; `type: bundle`, so rule 2d's ledger-replay does not apply). **Rule applied: ours**,
  on both the superset branch and the later-positioned-intent branch of 2e.

Cherry-pick of `9e4bad08e6` (`xgd(ticket): update bundle bundle-b3b7c399`, author date
2026-08-31 07:22:25 -0700) onto HEAD `c88aed46b0`. The file materialised on disk with real
conflict markers (lines 8–16) despite `.xgd/tickets/` being outside the sparse-checkout cone.

### Chain context

HEAD is still `c88aed46b0`, unchanged from the previous attempt at scope `100/0` — confirming
that pick (`e126b1aa2b`) was correctly detected as empty and skipped. This pick is its
**child**: stage 1 (merge base) here is blob `a9979c2f4e`, which is exactly the blob
`e126b1aa2b` introduced. So the resync queue is walking a chain of successive bundle-status
commits, each of which conflicts against the same already-further-along ours side.

### The conflict

`status: free_and_reconciled` is **outside** the hunk this time — both sides now agree on it,
because incoming has caught up to the endpoint ours already held. Incoming's entire delta vs
its parent is three lines (`updated_at`, `completed_at`, `status`). Only three scalars
conflicted:

| field                | base (1)              | ours (2)                     | incoming (3)              |
|----------------------|-----------------------|------------------------------|---------------------------|
| `updated_at`         | 2026-08-31T05:05:42   | **2026-08-31T14:23:04.453705** | 2026-08-31T14:22:25.238981 |
| `completed_at`       | `null`                | **2026-08-31T14:22:24.820529** | 2026-08-31T14:22:25.238981 |
| `last_field_updated` | `status`              | **`result`**                 | `status`                  |
| `status`             | `reconciling`         | `free_and_reconciled`        | `free_and_reconciled` (agreed, not in hunk) |

Per-fact reasoning, as 2e requires:

- **`updated_at`** — ours (14:23:04) is later than incoming (14:22:25). Ours wins outright.
- **`last_field_updated`** — definitionally bound to `updated_at`: it names the field touched
  by the update that *set* `updated_at`. Taking ours' `updated_at` alongside incoming's
  `status` would assert that the 14:23:04 update touched `status`, which is false on **both**
  sides. These two fields must move together; ours wins with `updated_at`.
- **`completed_at`** — incoming's stamp is 0.4 s *later* (…:25.238981 vs …:24.820529), so a
  mechanical "later wins" would pick incoming's. I took ours, deliberately. `completed_at` is
  not an independently-evolving fact: it is a one-shot stamp of a single completion event,
  recorded twice on two branches 0.4 s apart. That gap is clock/replay skew between
  xgd-working and the main-rooted resync branch, not competing intent. Ours' value is also the
  one coherent with the surviving body (`merged_at_commit`, `result: pass`, collapsed
  `commits`) that the auto-merge already kept from ours — splitting the triple would produce a
  ticket whose own fields contradict each other.

### Superset check

2e's "one side a strict superset: keep the superset" independently points the same way. Ours
carries, and incoming entirely lacks:

- `commits` collapsed to a single reconciled entry with `main_sha: eef7a8b48b…`
  (incoming still lists **24** open entries, each `main_sha: null`, `working_sha_history: []`)
- `orphan_commits` (~150 old_sha/new_sha remap pairs)
- `merged_at_commit: eef7a8b48bfa15c54b64db9541a0e781a016ba9e`
- `result: pass`

Incoming contributes nothing ours lacks.

## Incoming changes preserved

No code, implementation, or UAT test files were in conflict — the sole conflicted path is a
bookkeeping ticket. 2f is therefore not engaged, and the **BUG-1301 PRECEDENCE exception was
not invoked**: no hunk was dropped under it.

Incoming's contribution is **subsumed, not discarded**. Its three-line delta was
`reconciling` → `free_and_reconciled` plus the matching `completed_at`/`updated_at` stamps.
The resolved file holds `status: free_and_reconciled` (agreed by both sides, never in
conflict) and a non-null `completed_at`. Every semantic change incoming makes is present in
the result; only the 0.4 s-earlier duplicate timestamp and the stale
`last_field_updated: status` were superseded by ours' strictly later, coherent triple.

Verified in the staged blob:

- `status: free_and_reconciled` — incoming's actual intent, present.
- `completed_at` non-null — incoming's actual intent, present.
- `main_sha: eef7a8b48b…` (line 16), `merged_at_commit:` (line 300), `result: pass`
  (line 301) — ours' superset, retained.

## Staging

    git checkout --ours --ignore-skip-worktree-bits -- .xgd/tickets/hot/bundle-b3b7c399.md
    git add --sparse -- .xgd/tickets/hot/bundle-b3b7c399.md

Each write issued as the sole content of its own call, per BUG-1294. Sparse-cone notes
(unchanged from the `100/0` attempt): plain `git checkout --ours` skips the index and leaves
all three stages — `git checkout` has no `--sparse` flag (that spelling belongs to `git add`;
checkout exits 129 with ``unknown option `sparse'``), the correct flag is
`--ignore-skip-worktree-bits`. `git add` without `--sparse` then silently refuses the same
path.

Verified after staging: `git status --porcelain` empty, `git ls-files -u` empty, zero conflict
markers in the staged blob, and `git diff --cached HEAD` empty for this path — stage 0 is ours
exactly, not a hand-merged hybrid.

## Note for the sequencer

`git diff --cached HEAD` is **empty**: HEAD already contains a strictly later and strictly
richer state of this ticket, so this pick is again a no-op. Expected empty-cherry-pick shape,
not a lost change. The sequencer was **not** advanced — no `--continue`, `--skip`, `--quit`,
or `--abort` was issued, and `CHERRY_PICK_HEAD` remains live at `9e4bad08e6`. Python's
finalize step should detect the clean staged diff and skip the commit.

Given that stage 1 of this pick was the blob introduced by the previously-skipped
`e126b1aa2b`, further commits in this chain will likely present the same shape.

## Flagged for post-merge review

Per the auto-enrichment rule, `.xgd/tickets/hot/bundle-b3b7c399.md` is flagged: both sides
carry an identical commit subject with no distinguishing intent metadata, so the resolution
rests on lifecycle ordering, field coherence, and the superset check above rather than on a
declared intent.

## Correction to the scope-100/0 report (REPORT-5308)

That report described the incoming side's open `commits` list as "~100 … entries". The
accurate figure is **24 entries** (~100 *lines*, at four lines each) — I read a truncated diff
there. The resolution and its rationale are unaffected: the collapse of those entries into a
single `main_sha`-bearing entry on the ours side is what the count was cited to evidence, and
that remains true at 24.
