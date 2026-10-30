---
uid: report-609c0f41
id: REPORT-5606
type: report
title: 'Resync resolve conflicts: 9ac98712a7'
created_by: xgd
created_at: '2026-09-29T19:38:15.908985+00:00'
updated_at: '2026-09-29T19:38:15.908985+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — bug-93851fea (BUG-41)

- **Resync anchor**: `report-377b581e`
- **Apply target**: `9ac98712a708888db67f8aff21f22b16bd98094e`
- **Cherry-picked commit**: `15c8e536ac` (2026-09-09 14:31:17 -0700, "xgd(ticket): update bug bug-93851fea")
- **HEAD at resolution**: `37f1ec69c5`
- **Retry count for this conflict sha**: 1
- **Conflicting path**: `.xgd/tickets/hot/bug-93851fea.md` (the only file in the picked commit's diff)
- **Resolution**: `--ours`
- **Net change from HEAD**: zero (finalize will skip the commit)

## Shape

This is the **third shape** (no bundle-pair adjudication needed), fifth instance
on this branch. The picked commit is a combined `status` flip + unbundle out of
`bundle-4efd33fe`; xgd-working itself re-bundled the ticket into main's
`bundle-8e1807f6` two days later. Because the two sides never disagree about
which bundle owns the ticket, the `bundle-4efd33fe`-vs-`bundle-8e1807f6`
comparison is moot.

## Decisive evidence

`git show xgd-working:.xgd/tickets/hot/bug-93851fea.md` differs from `:2:` (ours)
in **`updated_at` alone**, by 13 seconds:

```
< updated_at: '2026-09-19T15:15:30.393519+00:00'   # ours   (94511b25a5)
> updated_at: '2026-09-19T15:15:43.971601+00:00'   # theirs (16ccbbac82)
```

Everything else is identical, including the terminal state ours already holds:
`status: free_and_reconciled`, `completed_at: '2026-09-14T10:29:09.410155+00:00'`,
`bundled_in: bundle-8e1807f6`. So ours already *is* xgd-working's own final
decision for this ticket, and the picked commit is a transient waypoint that
xgd-working superseded.

## Subsumption check — every fact the removal touched is restored

The picked commit `15c8e536ac` changed three facts. xgd-working's own next
commit on the path, `350cec2af5` (2026-09-11 11:53:54), restores all three:

| fact | base (`:1:`) | theirs (`15c8e536ac`) | restored by `350cec2af5` |
|---|---|---|---|
| `updated_at` | 09-09T00:17:23 | 09-09T21:31:17 | 09-11T18:53:54 |
| `status` | `bundled` | `ready_to_reconcile` | `bundled` |
| `bundled_in` | `bundle-4efd33fe` | *(removed)* | `bundle-8e1807f6` |

Blob chain confirms direct succession: `15c8e536ac` produces blob `6ab3ff57c5`,
and `350cec2af5`'s diff header reads `index 6ab3ff57c5..5285540cf2`. One `show`
settles it — no second `diff` needed.

## Three-way divergence

```
base vs ours:    updated_at, completed_at (null -> set), status (bundled -> free_and_reconciled), bundled_in (4efd33fe -> 8e1807f6)
base vs theirs:  updated_at, status (bundled -> ready_to_reconcile), bundled_in removed
```

`completed_at` and the `bundled_in` retarget are on ours alone; `status` diverges
on both sides but ours is downstream of theirs on xgd-working's own timeline.
Bodies are byte-identical on all three sides.

## Note on the enrichment rule

The auto-enrichment supplied "intent unknown → take the more recent commit by
timestamp". That rule happens to agree with `--ours` here (ours' `updated_at` is
09-19, theirs' 09-09), but the agreement is incidental — the blob/subsumption
chain above is what settles it. Ledger sizes are the usual asymmetry: ours has
3 commits (two `seed_local_overlay` snapshots + one update), incoming has 12.

## Forecast for the remaining picks on this path

xgd-working commits after `15c8e536ac`, in order:

1. `350cec2af5` (09-11) — re-bundle into `bundle-8e1807f6`, `status` back to `bundled`. **`--ours`.**
2. `cf8afea41c` (09-14) — sets `completed_at` and `status: free_and_reconciled`. Ours already carries exactly these values. **`--ours`.**
3. `521eb9a150` (09-15) — `status` **backward** to `bundled`. **`--ours`** (superseded by #4).
4. `16ccbbac82` (09-19, tip) — `status` back to `free_and_reconciled`, `updated_at` 09-19T15:15:43. **NOT `--ours`**: everything matches ours except `updated_at`, which is genuinely 13 s later on incoming. Incoming wins that one fact.

**Backward-lifecycle trap present**, same as request-51514090 and
request-8b33a146: `free_and_reconciled` (09-14) → `bundled` (09-15) →
`free_and_reconciled` (09-19). Do not assume the lifecycle is monotone when
judging whether an incoming `status` is genuine progress.

## Verification

```
$ git status --short
(no output — index clean, no unmerged paths)
$ git diff --cached HEAD --stat
(no output — zero net change from HEAD)
```
