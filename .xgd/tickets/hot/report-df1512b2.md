---
uid: report-df1512b2
id: REPORT-5734
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T10:48:44.354670+00:00'
updated_at: '2026-09-30T10:48:44.354670+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-8e1807f6.md` — **UU**, intent/bookkeeping ticket (rule
  **2e**). Resolved to the HEAD-side frontmatter block. Staged with
  `git add --sparse` (path is outside the resync branch's sparse cone, so the
  conflict lived in the index with working-tree markers materialised).

  Conflict was a single frontmatter hunk. Three-way facts:

  | fact | base (`983e27fc^`) | incoming (`983e27fc`) | HEAD | taken |
  |---|---|---|---|---|
  | `updated_at` | `2026-09-14T10:28:59` | `2026-09-16T01:48:46` | `2026-09-19T15:19:02` | HEAD |
  | `completed_at` | `2026-09-14T10:28:59` | unchanged | `2026-09-14T10:28:58` | HEAD |
  | `last_field_updated` | `status` | unchanged | `result` | HEAD |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | unchanged | HEAD (base) |

  `updated_at` is the only fact both sides changed — a genuine conflict, settled
  by 2e's timeline rule in favour of the later-positioned intent. Verified with
  `xgd working-timeline`: incoming `983e27fc` sits at `2026-09-16T01:48:46Z`,
  while the HEAD-side writes to this ticket sit at `2026-09-19T15:19:03Z`
  (`103cf3fd`) and `2026-09-25T11:03:24Z` (`ea3c7539`). HEAD is later.

  `status` is the one fact only *incoming* moved, and it is **not** treated as a
  non-overlapping field to be carried over. `status`, `last_field_updated` and
  `result` are one lifecycle fact spread across three lines, and the two sides
  moved it in opposite directions from the same base: incoming demotes a bundle
  that was already `free_and_reconciled` back to `ready_to_reconcile`, whereas
  HEAD advances it and records the reconcile's own outputs. `free_and_reconciled`
  is the terminal status ("reconcile completed, ff_push'd to main",
  `core/cherry_pick.py:686`), so applying incoming's `status` in isolation would
  put a terminal, ff-pushed bundle back into the reconcile queue while it still
  carries `result: pass`, `merged_at_commit`,
  `session_assessor` / `session_assessor_started_at`, `regression_anchor_uid`
  and a populated `reconcile_sha` — a self-contradictory ticket, and a lifecycle
  regression the working timeline has already moved past.

  No content is lost by this choice: incoming's version of the file is
  `base ∪ {updated_at, status}`, and both of those are the superseded
  earlier-positioned values. HEAD is a strict superset of everything else —
  `skipped_commits`, `orphan_commits`, `reconcile_sha`, `regression_anchor_uid`,
  `merged_at_commit`, `session_assessor*` and `result: pass` are HEAD-only
  additions, all outside the markers and all preserved intact (confirmed by
  diffing all three index stages, not just the marked hunk).

## Incoming changes preserved

No code or implementation files were in this conflict. The sole conflicted path
is an intent/bookkeeping ticket, so the "INCOMING is authoritative" hard rule —
scoped to code and implementation files — does not apply; rule 2e's per-fact
timeline rule governs, and was applied as tabulated above.

Incoming commit `983e27fc9d94146fa7cba0f5f58d69ebb760a7ec`
("xgd(ticket): update bundle bundle-8e1807f6", Martin Westhead,
2026-09-15 18:48:46 -0700) touches exactly one file, and that file is the
conflicted ticket. `git show 983e27fc -- .xgd/tickets/hot/bundle-8e1807f6.md`
carries no hunk beyond the two frontmatter scalars above. No developer-authored
code, test, or matrix content is in this commit, so none was discarded.

The BUG-1301 precedence exception was not used.

## Staging state

`git ls-files -u` is empty and `git status --porcelain` is clean. The staged
tree is byte-identical to HEAD (`git diff --cached HEAD` empty), because HEAD
already holds the resolved content — the later-positioned intent for every
conflicting fact was already on this branch.

Per STEP 4 this is **not** escalated and `--skip` was **not** called:
`resync_cherry_pick_finalize_resolution` owns that decision and will detect the
clean staged diff itself. `CHERRY_PICK_HEAD` is intact at
`983e27fc9d94146fa7cba0f5f58d69ebb760a7ec`; no `--continue` / `--skip` /
`--quit` / `--abort` / `reset` / `checkout <branch>` was run.
