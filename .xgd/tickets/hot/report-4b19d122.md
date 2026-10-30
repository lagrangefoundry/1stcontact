---
uid: report-4b19d122
id: REPORT-5236
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:04:24.071353+00:00'
updated_at: '2026-09-28T01:04:24.071353+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — **UU**, intent/bookkeeping ticket
  (STEP 2e). Two conflict hunks: the frontmatter lifecycle block and a trailing
  body section. Resolved by taking **ours wholesale**, because ours is a strict
  superset of the incoming side — 2e's "one side a strict superset: keep the
  superset" branch, not a per-fact tie-break.

  Verified mechanically rather than by eye: the complete set of lines present in
  the incoming blob (`863e47ac`) and absent from the ours blob (`e3e27e2c`) is
  five lines, all of them facts ours supersedes with a later value —

  | incoming (2026-08-23) | ours (2026-08-31) |
  |---|---|
  | `updated_at: '2026-08-23T23:42:40.733621+00:00'` | `updated_at: '2026-08-31T19:19:38.358283+00:00'` |
  | `completed_at: null` | `completed_at: '2026-08-31T19:19:38.358283+00:00'` |
  | `last_field_updated: body` | `last_field_updated: status` |
  | `status: draft` | `status: free_and_reconciled` |
  | `Scope drafted, awaiting operator confirmation before coding.` | "Both halves landed and verified (2026-08-23)…" |

  Ours is later on every contested fact, so the per-fact timeline rule and the
  superset rule agree. Ours additionally carries reconciliation bookkeeping the
  incoming side has no knowledge of (`story_points: 3`, `commits[0].working_sha:
  ea48502d…`, `version: 0.2.10`, `bundled_in: bundle-78f4e2fe`) and an ours-only
  trailing section `# Implementation — the tenant fix` (~107 lines).

  Taking the incoming side here would have regressed an operator-owned lifecycle
  field (`free_and_reconciled` → `draft`), cleared `completed_at`, and dropped
  the bundle/version linkage — the classic overlay-vs-incoming status regression.
  Nothing on the incoming side was discarded to achieve that.

Staged result is byte-identical to HEAD (`git status --porcelain` empty, staged
blob `e3e27e2c`), so this cherry-pick carries no net change; finalize is expected
to skip the commit. `git cherry-pick --continue/--skip/--quit/--abort` was not
called — `CHERRY_PICK_HEAD` (`6ffb45e6`) is still present.

## Incoming changes preserved

Yes — fully, with no hunks dropped and no invocation of the BUG-1301 precedence
exception.

The incoming commit `6ffb45e6` ("xgd(ticket): update bug bug-db356ff8") made
exactly two changes against the merge base (`71083b23`):

1. Bumped `updated_at` from `2026-08-23T23:03:08` to `2026-08-23T23:42:40`.
   Superseded by ours' strictly later `2026-08-31T19:19:38` — the same field,
   later intent wins.
2. Appended the body section
   `## Implementation — landed and verified end to end (2026-08-23)`, covering
   the `free-BUG-36` provisioning/publish run, the production D1 counts
   (`tenants=1, sites=1, pages=2, assets=9`), the `NODE_USE_ENV_PROXY=1`
   `fetch failed` finding, and the client-secret handling note ending
   `29edd0e0ede45619455f21128c7b88ce.access`.

Change (2) — the incoming side's entire substantive contribution — is present
**verbatim** in the resolved file, ahead of the ours-only
`# Implementation — the tenant fix` section. Confirmed by diffing the incoming
blob against the resolved blob: the diff contains no deletion of any line from
that section.

No code files were in conflict, and no UAT test function on either side was
deleted.
