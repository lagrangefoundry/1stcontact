---
uid: report-2a4b85a9
id: REPORT-5615
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T23:11:21.820777+00:00'
updated_at: '2026-09-29T23:11:21.820777+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — `bundle-8e1807f6` birth revision

## Scope

- Resync branch: `resync-377b581e`, HEAD `f38bc7ef24791e08a21b5d21c083115cede380c7`
- Apply target: `9ac98712a708888db67f8aff21f22b16bd98094e`
- Anchor: `report-377b581e`
- Picked commit: `053d17e543` — `xgd(ticket): create bundle bundle-8e1807f6`
  (2026-09-11 11:53:53 -0700)
- Conflicting path: `.xgd/tickets/hot/bundle-8e1807f6.md`
- Index class: **AA** (both added) — no stage 1, so there is no merge base to
  diff against. Stage 2 (ours) `23fbaeabac`, stage 3 (theirs) `4e3e650030`.
- `prior_stage_failure`: empty.

## Resolution

`git checkout --ours -- .xgd/tickets/hot/bundle-8e1807f6.md` +
`git add --sparse`. **Zero net change from HEAD** (`git diff HEAD --stat` empty),
so finalize will skip the commit.

## Why ours

The enrichment reported "intent unknown on one or both sides → take the more
recent commit by timestamp and flag for post-merge review". The timestamp rule
happens to agree with `--ours` here, but the decisive evidence is the
ancestor/descendant relation, not the clock.

**It is one bundle, not two.** Both sides share `uid: bundle-8e1807f6`,
`id: BUNDLE-27`, the title `REQ-155 + BUG-40 + REQ-160 + BUG-41 + BUG-42 + 3 more`,
the eight-entry `commits` list, and `created_at` to the microsecond
(`2026-09-11T18:53:53.741845+00:00`). Theirs is the literal birth revision of
the file; there is no "which bundle owns this" question to adjudicate.

**Theirs is a strict prefix of ours.** The whole theirs→ours delta is forward
progress and nothing else:

| field | theirs (birth) | ours |
| --- | --- | --- |
| `updated_at` | `2026-09-11T18:53:53.741845Z` | `2026-09-19T15:19:02.855469Z` |
| `completed_at` | `null` | `2026-09-14T10:28:58.377424Z` |
| `last_field_updated` | `created_at` | `result` |
| `status` | `ready_to_reconcile` | `free_and_reconciled` |
| `commits[4].reconcile_sha` | `null` | `2cd4e5865d…` |
| `skipped_commits`, `orphan_commits`, `regression_anchor_uid`, `merged_at_commit`, `session_assessor*`, `result: pass` | absent | present |

Body: byte-identical across 1253 lines apart from ours omitting the trailing
newline. Theirs contributes no field ours lacks, so nothing incoming is lost.

**No tip exception.** `git show xgd-working:<path>` (tip `24da3fa335`, 09-19
08:15:32 -0700) also reaches `free_and_reconciled`, so both sides converge on
the same endpoint — the picked commit is a transient birth waypoint. Diffed
against ours, the tip is *behind* on every axis but one: ours' `updated_at` is
3 m 30 s later, and ours carries `result: pass`, `reconcile_sha`,
`skipped_commits`, `orphan_commits`, `regression_anchor_uid`,
`merged_at_commit` and `session_assessor*`, all of which the tip lacks
entirely. The tip's only lead is `completed_at` by **1.006 s**
(`10:28:59.383699` vs `10:28:58.377424`) — that is the two sides stamping the
same reconcile event a second apart, not a later decision. Per the
whole-frontmatter rule, a lone slightly-later timestamp on theirs plus fields
theirs does not have at all means ours is strictly later in the same sequence.

**`working_sha` caveat (scoped).** Ours keeps all eight `working_sha` entries
with `main_sha: null`, adds one `reconcile_sha`, and records five rewrites in
`orphan_commits` plus one `skipped_commits` entry. `orphan_commits` records only
commits reconcile had to rewrite, so its not covering every working sha is
expected and is not lost intent.

## Forecast for the remaining picks

`xgd-working` has **10** commits touching this path; this was the first. The
remaining nine are all pre-`result` waypoints on the same monotone run to
`free_and_reconciled`, and the tip has already been shown to be behind ours, so
**all nine forecast `--ours` with zero net change** — there is no tip exception
in this series:

`37bc79fdf5` (09-11 12:19), `60cf2443ce` (09-11 14:04), `551e8ffc0b` (09-11
14:07), `2db1e81223` (09-14 03:28), `983e27fc9d` (09-15 18:48), `d9d9554def`
(09-16 14:58), `9a247c2724` (09-17 13:19), `ae5bad3d60` (09-17 13:22),
`24da3fa335` (09-19 08:15, tip).

Some of these may not conflict at all — where a waypoint's blob differs from
ours only in fields ours already supersedes, git can auto-merge once the base
advances.

Note the ours-side ledger for this path is long too (15+ commits, tip
`ea3c75397a` 09-25), so ours is not a single overlay snapshot — it is main's
own reconcile run carried through to `result: pass`.

## Verification

Read-level only: `git status --short` clean, `git diff HEAD --stat` empty,
no conflict markers left in the index. This is a ticket-metadata file, so no
test suite applies; the caretaker rule forbids `test_fix` and the workers
suites are unrunnable in a headless role regardless.
