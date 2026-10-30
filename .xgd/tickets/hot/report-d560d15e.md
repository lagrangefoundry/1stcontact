---
uid: report-d560d15e
id: REPORT-4724
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:04:03.010927+00:00'
updated_at: '2026-09-21T14:04:03.010927+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket
  (`request-*` kind, §2e). Resolved to **ours** (blob `b4342d0d`).

  Incoming commit this attempt is `36728a6a1a63437f2d2a7c5d39fcb96ad1f3c4b3`
  (`xgd(ticket): update request request-3bc4b835`). Three-way read of the index
  stages:

  | stage | blob | status | updated_at | last_field_updated |
  |---|---|---|---|---|
  | base | `e6b5619e` | `free_coded` | 2026-09-01T01:31:19 | `status` |
  | theirs | `2b8dcbd1` | `free_coded` | 2026-09-01T01:31:23 | `story_points` |
  | ours (HEAD) | `b4342d0d` | `bundled` | 2026-09-09T21:32:50 | `status` |

  **The incoming commit carries no substantive field change.** `diff base ->
  theirs` touches exactly two lines: the `updated_at` bump (+4s) and the
  `last_field_updated` marker flipping to `story_points`. The `story_points`
  value itself is `3` on every side — verified independently with
  `git grep -n story_points 36728a6a... -- <path>` and `git grep -n story_points
  HEAD -- <path>`, both reporting `story_points: 3`. So this is a bookkeeping-only
  write that recorded a field touch without altering the field's value.

  The two markers theirs uniquely holds are both single-valued "most recent
  write" metadata, which cannot be merged with ours — there is no composition of
  `last_field_updated: story_points` and `last_field_updated: status`, only a
  later writer. §2e's per-fact rule therefore resolves each in ours' favour:
  ours' `status`/09-09T21:32:50 write is positioned strictly after theirs'
  `story_points`/09-01T01:31:23 write. On every other field ours is a strict
  superset — it carries the same `commits` list and `version: 0.2.29`, and adds
  `bundled_in: bundle-87be4669`, the `free_coded -> bundled` advance, and the
  REQ-178 body note on the account/business split. The auto-enriched metadata
  rule ("take the more recent commit by timestamp") selects the same side.

  Mechanics: the path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so
  the conflict existed only in the index with no working-tree markers. Resolved
  via `git update-index --cacheinfo` to ours' blob, collapsing stages 1/2/3 to
  stage 0, then restored the `skip-worktree` bit (cleared by the conflict) to
  match every sibling under `.xgd/tickets/hot/`. Confirmed with
  `git ls-files -sv`: `S 100644 b4342d0d... 0`.

## Incoming changes preserved

Confirmed. No code or implementation file was involved — this is a single
ticket-metadata file.

The incoming commit's entire delta over base is the `updated_at` timestamp and
the `last_field_updated` marker. Neither is developer content: no field value,
no body text, no structural edit. Both are superseded by ours' later write to
the same two fields, which is exactly the resolution §2e prescribes for a fact
set differently on both sides. Nothing substantive was discarded.

**No BUG-1301 precedence exception was invoked** — no hunk was dropped, no test
function was deleted, and no file was removed.

## Note for the finalize step

The resolution leaves **no net change from HEAD**: `git diff --cached HEAD` is
empty, because ours already subsumed every meaningful part of theirs. Per the
brief this was staged and exited normally rather than skipped here; finalize
should detect the clean staged diff and skip the commit.

`CHERRY_PICK_HEAD` (`36728a6a1a63437f2d2a7c5d39fcb96ad1f3c4b3`) was left intact
— no `--continue`, `--skip`, `--quit`, or `--abort` was run. HEAD remains
`fd37d3ce06602a4bbeeb1546252d6730ed4dd4d2`.
