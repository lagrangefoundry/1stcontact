---
uid: report-fd6828a5
id: REPORT-4747
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:50:17.881994+00:00'
updated_at: '2026-09-21T14:50:17.881994+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` — **UU**, intent/bookkeeping ticket (STEP 2e).
  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1): the conflict existed only
  in the index, with no working-tree file present. Resolved by materialising the stage-2
  blob and staging with `git add --sparse`.

  Per-fact comparison of the two sides against the merge base:

  | fact | base | ours (HEAD, `f8f42b8e54`) | theirs (`e0795d9332`) |
  |---|---|---|---|
  | `status` | `free_coding` | `free_and_reconciled` | `free_coded` |
  | `updated_at` | 2026-09-01T18:36:24 | 2026-09-19T15:15:32 | 2026-09-01T18:57:55 |
  | `completed_at` | `null` | 2026-09-14T10:29:15 | `null` |
  | `fields.commits` | absent | `[{working_sha: ab467d6ce366…, reconcile_sha: null, main_sha: null}]` | identical |
  | `fields.version` | absent | `0.2.32` | `0.2.32` |
  | `fields.bundled_in` | absent | `bundle-8e1807f6` | absent |

  Both sides independently added the same `commits` block and `version: 0.2.32` — no
  conflict there. The only genuinely competing fact is `status`, and ours is strictly
  downstream of theirs on the lifecycle (`free_coding` → `free_coded` →
  `free_and_reconciled`; confirmed against the status values in use across the other hot
  tickets). Ours also carries `bundled_in` and a set `completed_at`, which theirs lacks,
  and a later `updated_at` on every axis — consistent with the enrichment note's
  "take the more recent commit by timestamp" rule.

  Result: **ours taken**, verbatim. Nothing unique to theirs was discarded. The body
  (all ~170 lines from the H1 through the `## Origin` section) is byte-identical between
  the two sides apart from theirs' missing trailing newline; ours' trailing newline is
  preserved, matching the merge base.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification applies as a
per-fact check rather than a hunk check. Every fact introduced by the incoming side
(`fields.commits` with `working_sha: ab467d6ce366…`, `fields.version: 0.2.32`) is
present in the staged result; the incoming `status: free_coded` is superseded by ours'
strictly-later `free_and_reconciled`, which is the intended lifecycle outcome, not a
dropped change. No BUG-1301 precedence exception was invoked.

## Staging state

`git status --porcelain` is empty and `CHERRY_PICK_HEAD` (`e0795d9332`) is intact.
The staged tree is identical to HEAD, so this cherry-pick has no net effect — an
earlier commit in the resync queue already carried the same ticket state. Per STEP 4,
`--skip` was NOT invoked; the finalize step will detect the empty staged diff and skip
the commit.
