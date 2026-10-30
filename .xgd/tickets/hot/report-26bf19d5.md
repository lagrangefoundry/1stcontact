---
uid: report-26bf19d5
id: REPORT-5463
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:02:04.102950+00:00'
updated_at: '2026-09-29T05:02:04.102950+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Incoming commit: `d975830c32dc46b84122a007d48214ef40ef2986`
("xgd(ticket): update bug bug-3ade1af4", 2026-09-01 12:28:25 -0700).

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, intent/bookkeeping ticket
  (STEP 2e). One conflict hunk, confined to four frontmatter lines; the
  body and `fields:` block merged cleanly. Resolved per-fact:

  | fact | base | ours (HEAD) | theirs (incoming) | taken |
  |---|---|---|---|---|
  | `updated_at` | 2026-09-01T19:28:24Z | 2026-09-19T15:15:31Z | 2026-09-01T19:28:25Z | ours |
  | `last_field_updated` | `status` | `status` (unchanged) | `story_points` | ours — see note |
  | `completed_at` | `null` | 2026-09-14T10:29:13Z | `null` (unchanged) | ours |
  | `status` | `free_coded` | `free_and_reconciled` | `free_coded` (unchanged) | ours |
  | `title` | "23 failures … ten UATs" | "27 failures + 30 collection errors … eleven UATs" | unchanged from base | ours (clean auto-merge, no conflict) |
  | `fields.bundled_in` | absent | `bundle-8e1807f6` | absent | ours |
  | `fields.commits[]`, `fields.version` | present | unchanged | unchanged | merged cleanly |

  **Note on `last_field_updated` — the one judgment call.** Read in
  isolation this fact looks non-overlapping (only the incoming side moved
  it, `status` → `story_points`), which 2e's "apply BOTH" clause would
  normally hand to the incoming side. It was NOT taken, deliberately:
  `last_field_updated` is not an independent fact, it is a *description of*
  the event stamped in `updated_at` — it names which field that update
  touched. Pairing ours' `updated_at` (2026-09-19, the reconcile that set
  `status: free_and_reconciled`) with theirs' `last_field_updated:
  story_points` would assert that the 09-19 update touched `story_points`,
  which is false on both sides' own evidence — `story_points: 5` is
  identical in base, ours and theirs, so no side ever changed its value.
  The two fields are therefore one composite fact, and the per-fact
  later-intent rule resolves the pair together in ours' favour (18 days
  later, and `free_and_reconciled` is strictly downstream of `free_coded`
  in the lifecycle).

## Incoming changes preserved

The incoming commit touched exactly one file and its complete diff against
the merge base is two lines:

1. `updated_at: …19:28:24 → …19:28:25` — superseded by ours' 2026-09-19
   value on the same fact (genuine intent conflict, 2e later-intent rule).
2. `last_field_updated: status → story_points` — not applied, for the
   composite-fact reason documented above. No data is lost by this:
   `story_points` itself is unchanged at `5` across base, ours and theirs,
   so the incoming commit carried no `story_points` *value* to preserve —
   only a now-stale label describing a 09-01 event that ours' 09-19 event
   has since replaced.

No code/implementation files were in conflict. No BUG-1301 precedence
exception was invoked and no UAT test function was touched or deleted.

## Staging state

`git add --sparse` applied; `git status --porcelain` is empty, i.e. the
staged result is byte-identical to HEAD — this incoming commit's effect is
already fully subsumed by HEAD's later state of the ticket. Per STEP 4,
`--skip` was NOT invoked; CHERRY_PICK_HEAD is left in place for the
finalize step, which will detect the empty staged diff and skip the commit.
