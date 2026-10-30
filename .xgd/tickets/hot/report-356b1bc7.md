---
uid: report-356b1bc7
id: REPORT-5607
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T19:42:11.912975+00:00'
updated_at: '2026-09-29T19:42:11.912975+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution: request-bbff35c7 (REQ-160) / b7733e01c9

**Anchor:** report-377b581e
**Apply target:** 9ac98712a708888db67f8aff21f22b16bd98094e
**HEAD:** 37f1ec69c5
**Cherry-picked commit:** b7733e01c90f6a5146326f8736605075fdc49012 (2026-09-09 14:31:18 -0700)
**Conflicting file:** `.xgd/tickets/hot/request-bbff35c7.md` (materialized with markers)
**Retry count for this conflict sha:** 1
**Resolution:** `--ours` — zero net change from HEAD.

## What each side did

Three-way divergence, base (`:1:`) = the cherry-picked commit's parent state
(`status: bundled`, `bundled_in: bundle-4efd33fe`, `completed_at: null`).

| fact | base | theirs (`b7733e01c9`) | ours (`:2:`) |
|---|---|---|---|
| `updated_at` | 2026-09-09T00:17:23 | 2026-09-09T21:31:18 | 2026-09-19T15:15:30 |
| `completed_at` | null | null | 2026-09-14T10:29:11 |
| `status` | `bundled` | `ready_to_reconcile` | `free_and_reconciled` |
| `bundled_in` | `bundle-4efd33fe` | *(removed)* | `bundle-8e1807f6` |

Theirs is a **combined status-flip + unbundle** out of `bundle-4efd33fe` in a
single commit — the "third shape". Bodies are identical on all three sides.

## Why `--ours`

The decisive read is the incoming branch's own final state, not a
`bundle-4efd33fe`-vs-`bundle-8e1807f6` adjudication:

    git show xgd-working:.xgd/tickets/hot/request-bbff35c7.md  vs  git show :2:...

differs **only** in `updated_at`, by 4.1 seconds
(ours `15:15:30.957486`, xgd-working `15:15:35.062631`). Both sides already
agree the ticket is `free_and_reconciled` under `bundle-8e1807f6` with
`completed_at: 2026-09-14T10:29:11`. The two sides never disagree about which
bundle owns this ticket, so no pair analysis is needed.

Theirs' removal of `bundled_in` is **subsumed, not lost**: xgd-working itself
re-bundled two days later in `3e930c9813` (2026-09-11 11:53:54), which restores
every one of the three facts theirs touched —
`updated_at` → 2026-09-11T18:53:54, `status` → `bundled`,
`bundled_in` → `bundle-8e1807f6` (main's bundle). So `b7733e01c9` is a
transient waypoint that the incoming branch superseded on its own; taking
`--ours` preserves the developer's later decision rather than discarding it.

Note the naive enrichment rule ("intent unknown → take the more recent commit
by timestamp") happens to agree with `--ours` here, since ours' `updated_at` is
09-19 against theirs' 09-09 — but that agreement is incidental; the
superseding-commit check is what settles it.

## Incoming ledger and forecast for the remaining picks

`git log --format='%h %ad %cd %s' --date=iso xgd-working -- <path>`:

| sha | date | what it does | forecast |
|---|---|---|---|
| `3e930c9813` | 09-11 11:53:54 | re-bundle into `bundle-8e1807f6`, `status` → `bundled` | `--ours` |
| `658724fef0` | 09-14 03:29:11 | `completed_at` set, `status` → `free_and_reconciled` | `--ours` (ours already holds these exact values) |
| `ab253e514e` | 09-15 18:48:40 | `status` back to `bundled` | `--ours` |
| `40c4cda1b4` | 09-19 08:15:35 | `status` → `free_and_reconciled`, `updated_at` 15:15:35.062631 | **NOT blanket-`--ours`** — incoming's `updated_at` is 4.1 s later than ours and wins that one fact; everything else is already identical |

**Backward-lifecycle trap present here:** `free_and_reconciled` (09-14) →
`bundled` (09-15) → `free_and_reconciled` (09-19). A status that moves backward
on xgd-working is normal; do not assume a monotone lifecycle when judging
whether an incoming `status` carries genuine new intent.

## Verification

- `git status --short` — clean, no unmerged paths.
- `git diff HEAD --stat` — empty; the resolution leaves zero net change, so
  finalize will skip the commit.
