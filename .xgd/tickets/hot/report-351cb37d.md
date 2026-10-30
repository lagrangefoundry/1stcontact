---
uid: report-351cb37d
id: REPORT-5748
type: report
title: 'Resync resolve conflicts: bundle-8e1807f6 position 7 (d9d9554def)'
created_by: xgd
created_at: '2026-09-30T13:32:57.103850+00:00'
updated_at: '2026-09-30T13:32:57.103850+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `bundle-8e1807f6` position 7 (`d9d9554def`)

Picked commit `d9d9554defc7d1ae8449b223cbeb3ca33e5b12bc` ("xgd(ticket): update
bundle bundle-8e1807f6", author 2026-09-16 14:58:07 -0700, 2 insertions /
2 deletions, 1 file). HEAD `30f2b0737a233920d60d93e11dc0788338c43fbd`, branch
`resync-377b581e`, anchor `report-377b581e`, `prior_stage_failure` empty.

This is **position 7 of the `bundle-8e1807f6` (BUNDLE-27) series** forecast in the
position-5 report (REPORT for `2db1e812`), which listed `d9d9554def` as row 2 of
its five-pick table with predicted `status: reconciling`, `reconcile_sha: null`,
`--ours`, zero net change, no tip exception. **The forecast held exactly.**

## Files resolved

`.xgd/tickets/hot/bundle-8e1807f6.md` — class `UU`, intent/bookkeeping ticket
(rule **2e**). ONE conflict region, in the frontmatter. Resolved to the HEAD-side
block. Staged with `git add --sparse` (the path is outside this branch's sparse
cone, so the conflict lived in the index with working-tree markers materialised).

Post-resolution state, all verified:

- Resolved file is **byte-identical to `HEAD:<path>`**, including the absence of a
  trailing newline (`diff` against `git show HEAD:<path>` empty).
- `git status --porcelain` **completely empty**.
- `git diff --cached HEAD --stat` **empty** — zero net change.
- `git ls-files -u -- <path>` empty; no conflict markers remain (`grep -c` = 0).
- `CHERRY_PICK_HEAD` **intact** at `d9d9554def`.

### Three-way facts

| fact | base (`d9d9554def^`) | incoming (`d9d9554def`) | HEAD | taken |
|---|---|---|---|---|
| `updated_at` | `2026-09-16T01:48:46.102488` | `2026-09-16T21:58:07.519410` | `2026-09-19T15:19:02.855469` | HEAD |
| `completed_at` | `2026-09-14T10:28:59.383699` | `2026-09-14T10:28:59.383699` | `2026-09-14T10:28:58.377424` | HEAD |
| `last_field_updated` | `status` | `status` | `result` | HEAD |
| `status` | `ready_to_reconcile` | `reconciling` | `free_and_reconciled` | HEAD |

Base's `updated_at` (`2026-09-16T01:48:46`) **is position 6's incoming value**,
confirming the queue walks this path in commit order — each pick's base is the
previous pick's theirs. Free positive sanity check that this is the forecast series.

## Incoming changes preserved — theirs is a strict prefix of ours

Judged on the **ours-vs-incoming diff**, not on lifecycle status (the position-5
report records that `status` oscillates across these picks, so status alone is not
evidence of ordering in either direction).

`git diff 23fbaeabac <pick>:<path>` yields **five `+` lines, and every one is a
lower-valued version of a field ours already holds. Incoming introduces no field
ours lacks:**

- `updated_at` — ours leads by ~3 days (09-19 vs 09-16).
- `completed_at` — incoming is 1.006 s later than ours, but this is **not** a later
  decision: incoming writes `completed_at` == base's own value, the same
  reconcile-completion event ours stamps 1.006 s earlier. This is the recurring
  "one reconcile event stamped twice ~1 s apart" pattern already adjudicated at
  positions 5 and 6 and for the `bundle-87be4669` tip.
- `last_field_updated` / `status` — superseded; ours continued past them to
  `result`.
- `reconcile_sha: null` where ours carries the real
  `2cd4e5865d1926bedf35fa7bd946639c58c9e555`.

Fields present on ours and **absent from incoming entirely**: `skipped_commits`,
`orphan_commits` (5 `old_sha`→`new_sha` entries), `regression_anchor_uid:
report-3b8d3d7e`, `merged_at_commit`, `session_assessor`,
`session_assessor_started_at`, `result: pass`.

The 1253-line body and the `commits` list are untouched by incoming, so position
1's adjudication of the `working_sha` / `orphan_commits` structure is not reopened.
**No incoming content is lost.**

### No regression outside the conflict markers

Checked explicitly, because git silently auto-takes theirs for lines only theirs
moved. Stripping the three marker lines from the working-tree file and diffing
against `HEAD:<path>` showed **only the four incoming frontmatter lines and
nothing else** — the entire remainder of the file was already HEAD's. Incoming's
whole delta from base is those 4 lines (`2 insertions / 2 deletions` per
`--stat`), all inside the marked region, so there was no out-of-marker surface to
regress.

Ours' blob `23fbaeabac8d6a5982ba8a50bd0dbf5d4bcd5df3` is **still unmoved** and
byte-identical to `HEAD:<path>` (`git diff 23fbaeabac HEAD:<path> --stat` empty) —
unchanged since position 2, which confirms positions 2–6's zero-net-change
resolutions really did net to nothing.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. Theirs is a strict prefix of ours with one
duplicate timestamp of an event ours already records, so this is a plain per-fact
judgment. Nothing required arbitration and nothing is a mechanical failure.

## Forecast for the remaining picks on this path

Ours' blob is unchanged, so the position-5 forecast still holds **by
construction**. Three picks remain:

| sha | status it writes | note |
|---|---|---|
| `9a247c2724` | `ready_to_reconcile` | `reconcile_sha: null`; `--ours`, zero net change |
| `ae5bad3d60` | `reconciling` | `reconcile_sha: null`; `--ours`, zero net change |
| `24da3fa335` (tip) | `free_and_reconciled` | `updated_at` 09-19 15:15:32 < ours' 15:19:02; only lead is `completed_at` by 1.006 s — **still `--ours`, no tip exception** |

Expect each to land as `UU` on this one path, one frontmatter hunk, resolved to
HEAD, zero net change. Judge each on its ours-vs-pick diff, never on lifecycle
status.

## Cost

10 Bash calls, 2 denials (both a `find` over a path outside the sandbox and one
compound `git ls-tree` + `sparse-checkout list`; both re-issued successfully in
permitted form, neither affected the resolution).
