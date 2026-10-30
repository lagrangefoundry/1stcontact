---
uid: report-9a123ae9
id: REPORT-5729
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T10:32:19.475623+00:00'
updated_at: '2026-09-30T10:32:19.475623+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e

Picked commit `9563d602d43693c9f6b0a43b7a63fb8f3cc7167b` — "xgd(ticket): update bug
bug-360c5a44", author 2026-09-15 18:48:37 -0700, +2/-2. HEAD `e70d1e699c`, anchor
`report-377b581e`, `prior_stage_failure` empty. One conflicted path, class `UU`,
materialized with a single conflict region.

**This pick was forecast.** `.xgd/tmp/resolve-report-377b581e-bug-360c5a44-ff482d9dcc.md`
(the immediately preceding pick on this path) predicted `9563d602d4` would come next and
resolve `--ours`, on the grounds that it moves `status` BACKWARD to `bundled` with an
`updated_at` earlier than ours. Every element of that forecast was re-verified live
below and holds.

## Files resolved

| Path | Class | Resolution | Net change |
|---|---|---|---|
| `.xgd/tickets/hot/bug-360c5a44.md` | `UU` (materialized, one region) | `--ours` | none |

Index stages: base `58a79a1246` / ours `0f983095aa` / theirs `c0b18a118a`.

Two free chain checks confirm the queue is walking this ticket's commits in order and
that the previous zero-net-change resolution really netted to nothing:

- base `58a79a1246` **is** the previous pick's (`ff482d9dcc`) *theirs* blob, exactly as
  that report recorded it; and
- ours `0f983095aa` **is** `HEAD:.xgd/tickets/hot/bug-360c5a44.md` — unmoved.

Both sides are frontmatter-only. The 118-line body is byte-identical across all three
stages.

## Incoming changes preserved

Theirs' entire delta from base is two frontmatter lines — `git diff :2: :3:` reduces to
exactly these:

| fact | base | theirs | ours |
| --- | --- | --- | --- |
| `updated_at` | `2026-09-14T10:29:01.338349+00:00` | `2026-09-16T01:48:37.740224+00:00` | `2026-09-19T15:15:28.543268+00:00` |
| `status` | `free_and_reconciled` | `bundled` | `free_and_reconciled` |

Nothing else in the commit. `completed_at`, `last_field_updated`, `bundled_in`, `fields`,
`commits` and the whole body are untouched by theirs, and ours already carries them
identically.

**Both of theirs' changes are superseded by the incoming side's own later work, so
nothing incoming contributed is discarded:**

1. **The backward `status` write is reversed by incoming itself.** The xgd-working tip on
   this path is `4de6b3df565e723d2e27b2019ce312e8d003bd5c` (author 2026-09-19 08:15:41
   -0700). Diffing ours against that tip yields exactly one line — `updated_at` — with
   `status: free_and_reconciled` on **both** sides. Incoming's own final state therefore
   holds the same terminal status ours does; this pick's `bundled` is a transient
   mid-lifecycle state that incoming subsequently undid (`free_and_reconciled` 09-14 →
   `bundled` 09-15 → `free_and_reconciled` 09-19). Keeping ours does not drop an incoming
   decision — it matches incoming's final one.

2. **`updated_at` is simply older on theirs.** Ours is `2026-09-19T15:15:28.543268`,
   three days after theirs' `2026-09-16T01:48:37.740224`, and is itself derived from the
   incoming side's own 09-19 state.

Note the trap this path sets: git auto-merged `status` to theirs' `bundled` (only theirs
moved that line relative to base), so the materialized file arrived carrying the backward
write *outside* the conflict region. Resolving only the marked `updated_at` hunk would
have silently regressed the ticket's lifecycle. `--ours` on the whole file is what avoids
that.

Per-fact judgment (§2e, intent/bookkeeping ticket) points to ours on both facts: one by
supersession, one by recency. The enrichment's naive "take the more recent commit by
timestamp" rule incidentally agrees with `--ours` here, but because a lifecycle status can
regress on xgd-working it is not load-bearing; the supersession diff above is what settles
it.

## Forecast for the remaining pick on this path

One pick remains on `bug-360c5a44`, and **it is the exception — it is NOT `--ours`**:

- the xgd-working tip, `4de6b3df56` as of this run (identify it by content and author date
  2026-09-19 08:15:41 -0700, not by that SHA — per-pick SHAs have been observed to change
  between runs on this branch). Ours-vs-tip is exactly one line: `updated_at`
  `2026-09-19T15:15:41.714382` vs ours' `2026-09-19T15:15:28.543268` (13.17 s later).
  Every other field is byte-identical, so incoming wins that one fact and the resolution
  should take theirs' `updated_at`.

Cheap re-verify for that pick: `git diff :2: :3:` should reduce to the single `updated_at`
line above. Because ours' blob did not move in this resolution, that forecast holds by
construction.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The resolution followed from blob evidence (the
incoming side's own tip carrying ours' terminal `status`, and a strictly later
`updated_at` on ours), not from a tie-break.

## Verification

- `git status --porcelain` — **completely empty**. No conflict markers remain.
- `git diff --cached --stat HEAD` — **completely empty**; the resolution is zero net
  change from HEAD.
- `CHERRY_PICK_HEAD` intact at `9563d602d43693c9f6b0a43b7a63fb8f3cc7167b`; HEAD unmoved at
  `e70d1e699c`.
- No `git cherry-pick --continue/--skip/--abort` was run; finalize owns the state
  transition and will skip the empty commit.
- Staging required `git add --sparse` — this worktree is a sparse checkout at 20% of
  tracked files and plain `git add` refuses the path.
