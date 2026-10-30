---
uid: report-3595b1f8
id: REPORT-5278
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:33:01.424412+00:00'
updated_at: '2026-09-28T03:33:01.424412+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — intent/bookkeeping ticket (STEP 2e), UU
  (materialized on disk with real markers despite `.xgd/tickets/` being outside
  the sparse cone; staged with `git add --sparse`). Resolved **ours**.

  Both sides edited the *same* frontmatter facts — `status`,
  `last_field_updated`, `updated_at` — so this is a genuine per-fact conflict,
  not a pair of disjoint edits that could be combined:

  | fact | ours (HEAD) | incoming (CHERRY_PICK_HEAD 0431fed4) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-31T19:19:34` | `2026-08-25T22:52:44` |
  | `completed_at` | `2026-08-31T19:19:34` | `null` |
  | `bundled_in` | `bundle-78f4e2fe` | (absent) |

  2e's tie-break is the later-positioned intent, per fact. Ours is later on every
  contested fact (six days later) and strictly downstream on the lifecycle
  (`free_coded` → `ready_to_reconcile` → `free_and_reconciled`). Incoming
  contributes no field that ours lacks, so taking ours discards nothing:
  incoming's `ready_to_reconcile` is a waypoint ours has already passed through.
  Taking incoming would have regressed the status and dropped `bundled_in`.

  Neither side touched the ticket body; both diffs against the merge base
  (`602e5ae7`) are frontmatter-only.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so there is no developer code to preserve or verify, and no
hunk was dropped under the BUG-1301 precedence exception.

The one incoming edit (lifecycle advance to `ready_to_reconcile`) is
intentionally superseded rather than lost: ours already records the later state
that supersedes it, per 2e's per-fact later-intent rule.

## Staging note

After resolution `git status --porcelain` is empty and `git ls-files -u` reports
no unmerged entries — the staged tree is identical to HEAD, because ours already
carried the superseding state. Per STEP 4 this was left staged rather than
skipped; finalize is expected to detect the clean staged diff and skip the
commit. `CHERRY_PICK_HEAD` was left intact; no `--continue`/`--skip`/`--quit`/
`--abort` was issued.
