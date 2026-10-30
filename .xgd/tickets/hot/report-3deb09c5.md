---
uid: report-3deb09c5
id: REPORT-5609
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T19:49:19.783753+00:00'
updated_at: '2026-09-29T19:49:19.783753+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — request-01ea4eec (REQ-155) @ `3858160517`

- Resync anchor: `report-377b581e` (branch `resync-377b581e`)
- Apply target (candidate publish tip): `9ac98712a708888db67f8aff21f22b16bd98094e`
- HEAD at resolution: `37f1ec69c5a03de4ae85e9fbd128ea67ac2e43c7`
- Conflicting path: `.xgd/tickets/hot/request-01ea4eec.md` (single file; outside the
  sparse cone, so no working-tree file and no conflict markers — all three sides
  read from the index)
- Retry count for this conflict sha: 1
- `prior_stage_failure`: empty

## Outcome

**`--ours` (HEAD). Zero net change from HEAD** — `git diff HEAD --stat` is empty
after staging, so finalize will skip the commit.

## Why

This is the recurring "third shape": theirs is a **combined status-flip +
unbundle** out of `bundle-4efd33fe`, which xgd-working itself superseded two days
later. No `bundle-4efd33fe`-vs-`bundle-8e1807f6` adjudication is needed.

Three-way facts (`.xgd/tickets/hot/request-01ea4eec.md`):

| fact | `:1:` base | `:3:` theirs (`3858160517`) | `:2:` ours (HEAD) |
|---|---|---|---|
| `updated_at` | 2026-09-09T00:17:23 | 2026-09-09T21:31:18 | 2026-09-19T15:15:32 |
| `completed_at` | null | null | 2026-09-14T10:29:15 |
| `status` | `bundled` | `ready_to_reconcile` | `free_and_reconciled` |
| `bundled_in` | `bundle-4efd33fe` | *(removed)* | `bundle-8e1807f6` |

Decisive reads, in order:

1. **Incoming branch's own final state.** `git show xgd-working:<path>` differs
   from `:2:` (ours) in **only `updated_at`** (18.4 s: `15:15:32` vs `15:15:50`)
   plus ours' trailing newline. The two sides never disagree about which bundle
   owns the ticket, so the bundle-pair analysis is moot.
2. **The superseding commit restores every fact theirs touched.** `b416e464f5`
   (2026-09-11 11:53) is authored by xgd-working on top of theirs' own blob
   (`index 168cf8669d..341427c588` — `168cf8669d` *is* `3858160517`'s result) and
   sets `updated_at` forward, `status` back to `bundled`, and re-adds
   `bundled_in: bundle-8e1807f6` — **main's bundle**. Theirs' unbundle is
   subsumed, not lost.
3. Ours already holds the terminal state (`free_and_reconciled` +
   `completed_at` + `bundle-8e1807f6`), which is strictly downstream of theirs.

The enrichment's naive rule ("intent unknown → take the more recent commit by
timestamp") happens to agree with `--ours` here, since ours' `updated_at` is
2026-09-19 vs theirs' 2026-09-09 — but that agreement is incidental; the
superseded-waypoint test above is what settles it.

## Forecast for the remaining picks on this path

The resync queue walks xgd-working one commit at a time, so expect up to four
more picks touching this file. Ledger after `3858160517`:

| pick | date | change | expected resolution |
|---|---|---|---|
| `b416e464f5` | 09-11 | re-bundle → `bundled`, `bundled_in: bundle-8e1807f6` | `--ours`, zero net change |
| `f76ab65b3a` | 09-14 | → `free_and_reconciled`, sets `completed_at` | `--ours`, zero net change |
| `1bf80ad12b` | 09-15 | **back** to `bundled` | `--ours`, zero net change |
| `9769d7a284` | 09-19 (tip) | → `free_and_reconciled`, `updated_at` 15:15:50 | **NOT blanket `--ours`** — incoming wins `updated_at` (18.4 s later than ours); `status`/`completed_at` already match ours |

**Backward-lifecycle trap:** `status` on xgd-working goes
`free_and_reconciled` (09-14) → `bundled` (09-15) → `free_and_reconciled`
(09-19). Do not assume a monotone lifecycle and hand a later-looking
`free_and_reconciled` to incoming on that basis alone.

## Verification

- `git status --short`: clean (resolution staged, nothing unmerged)
- `git diff HEAD --stat`: empty — resolution is byte-identical to HEAD
- No test run: `.xgd/tickets/**` is data, and workerd/wrangler suites are
  unrunnable in this role anyway.
