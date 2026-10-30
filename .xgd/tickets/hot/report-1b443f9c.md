---
uid: report-1b443f9c
id: REPORT-5617
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T23:18:29.484361+00:00'
updated_at: '2026-09-29T23:18:29.484361+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — `bug-3ade1af4` (BUG-40) / `f07da33a26`

- **Anchor**: `report-377b581e`
- **Apply target**: `9ac98712a708888db67f8aff21f22b16bd98094e`
- **Branch / HEAD at start**: `resync-377b581e` @ `f38bc7ef24`
- **Picked commit**: `f07da33a26b766ef6dec639da3de353979e46b67` — *xgd(ticket): update bug bug-3ade1af4*, 2026-09-11 11:53:54 -0700
- **Conflicting path**: `.xgd/tickets/hot/bug-3ade1af4.md` (class `UU`, materialized in the working tree)
- **Retry count for this SHA**: 1
- **prior_stage_failure**: empty
- **Resolution**: `--ours`, zero net change from HEAD
- **Result**: pass

This is the **third** pick on this ticket on this branch (`0e5ed3bec2` and
`c375e56e53` were resolved earlier), and it is the pick that the previous
resolution (REPORT-5608, `report-315b92e7`) forecast as `--ours`. The forecast
held exactly.

## Index sides

| stage | blob | state |
|---|---|---|
| `:1:` base | `d0932a15ec` | `updated_at` 09-09T21:31:18, `completed_at: null`, `status: ready_to_reconcile`, no `bundled_in` |
| `:2:` ours | `4b1ec9bd2a` | `updated_at` 09-19T15:15:31.624433, `completed_at` 09-14T10:29:13.489970, `status: free_and_reconciled`, `bundled_in: bundle-8e1807f6` |
| `:3:` theirs | `963294b597` | `updated_at` 09-11T18:53:54.016671, `completed_at: null`, `status: bundled`, `bundled_in: bundle-8e1807f6` |

Both sides' whole delta from base is confined to the frontmatter; the body is
untouched on both.

## Adjudication

**Fast exit: `bundled_in` is byte-identical on both sides** (`bundle-8e1807f6`).
The two sides agree which bundle owns this ticket, so there is nothing to
adjudicate and the `bundle-4efd33fe` / `bundle-8e1807f6` pair analysis is moot.
No `working-timeline`, no sibling-cluster heuristic, no blob-replay test needed.

That leaves exactly three diverging facts, and ours is strictly later on all
three:

| fact | theirs (`:3:`) | ours (`:2:`) |
|---|---|---|
| `updated_at` | 2026-09-11T18:53:54 | 2026-09-19T15:15:31 |
| `completed_at` | `null` | 2026-09-14T10:29:13 |
| `status` | `bundled` | `free_and_reconciled` |

The picked commit is a **transient waypoint that xgd-working itself
superseded**. Its own later commits on this path carry the state ours already
holds:

- `d2414ced51` (09-14 03:29) sets `completed_at: 2026-09-14T10:29:13.489970`
  and `status: free_and_reconciled` — *exactly* the values on ours.
- `79bbb8e08f` (09-19 08:15, xgd-working's tip for this path) lands
  `updated_at: 2026-09-19T15:15:46.300383`.

`git show xgd-working:.xgd/tickets/hot/bug-3ade1af4.md` differs from `:2:` in
**`updated_at` alone**, by 14.7 seconds (ours 15:15:31.624433 vs tip
15:15:46.300383). `completed_at`, `status` and `bundled_in` all match ours
byte-for-byte. So taking `--ours` discards no incoming intent: every fact
theirs contributes is either identical on ours or replaced by a later
xgd-working decision that ours already carries.

Note the enrichment's fallback rule ("intent unknown → take the more recent
commit by timestamp") happens to agree with `--ours` here, since ours' 09-19
`updated_at` is the later one — but that agreement is incidental. The
superseding-commit evidence above is what settles it.

## Actions taken

```
git checkout --ours -- .xgd/tickets/hot/bug-3ade1af4.md
git add --sparse -- .xgd/tickets/hot/bug-3ade1af4.md
```

Only the single path in the picked commit's own diff was staged. Afterwards
`git status --short` is empty and `git diff HEAD --stat` is empty — **zero net
change from HEAD**, so finalize will skip the commit and HEAD stays at
`f38bc7ef24`. That is the expected success signal for a ticket-file pick on
this branch.

## Verification

Read-level only. Per the caretaker rule this role does not run `test_fix`, and
the workerd/wrangler suites are unrunnable in a headless role (`listen EPERM`),
so no test run is claimed here. The resolution is a frontmatter-only ticket
metadata pick; correctness was established from the three index blobs and
xgd-working's own ledger for the path.

## Forecast for the remaining picks on this path

xgd-working's ledger for `.xgd/tickets/hot/bug-3ade1af4.md` has 14 commits;
`3fc6491817`…`f07da33a26` are now resolved. Three remain, re-verified live
against the current blobs:

| pick | date | delta | call |
|---|---|---|---|
| `d2414ced51` | 09-14 03:29 | `updated_at`→09-14T10:29:13, `completed_at`→09-14T10:29:13, `status`→`free_and_reconciled` — all three exactly what ours already has | `--ours`, expect zero net change (may even auto-merge) |
| `d137bd257e` | 09-15 18:48 | `updated_at`→09-16T01:48:35, `status` **back to** `bundled` | `--ours` — `updated_at` 09-16 < ours' 09-19, and the status move is backward |
| `79bbb8e08f` | 09-19 08:15 (tip) | `updated_at`→09-19T15:15:46.300383 | **NOT blanket `--ours`** — incoming wins `updated_at` alone, by 14.7 s; every other fact is ours already |

Two standing traps for this ticket, both confirmed live:

- **The lifecycle moves backward.** `status` goes
  `free_and_reconciled` (09-14) → `bundled` (09-15) → `free_and_reconciled`
  (09-19). Do not assume a monotone lifecycle and do not read an incoming
  `free_and_reconciled` as automatically later.
- **Whether the tip is an exception turns on the ours-vs-xgd-working-tip diff
  being empty or not.** Here it is not empty (14.7 s on `updated_at`), so the
  tip *is* an exception. On other tickets in this cluster where ours equals the
  tip byte-for-byte, it is not.
