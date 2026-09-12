---
uid: report-3206bdac
id: REPORT-4106
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:02:48.226829+00:00'
updated_at: '2026-09-12T19:02:48.226829+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, sparse-excluded
  (index-only, no working-tree markers). Rule **2e** (intent/bookkeeping
  ticket), strict-superset branch. Resolved with
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`.

  Conflict was frontmatter-only, in two hunks
  (`updated_at`/`completed_at`/`status`, and the `commits`/`version` block).
  The incoming commit `1eb1dd1586` is the original free-coding bookkeeping
  update from 2026-08-24: `status: free_coding -> free_coded`, first `commits`
  entry (`working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc`),
  `version: 0.2.11`. HEAD already holds a strictly later state of the same
  ticket, seeded from the working store:

  | fact | incoming | HEAD (kept) |
  |---|---|---|
  | `updated_at` | 2026-08-24T21:42:43 | 2026-08-31T19:19:36 |
  | `completed_at` | null | 2026-08-31T19:19:36 |
  | `status` | free_coded | free_and_reconciled |
  | `commits` | 1 entry (`2058a164`) | 3 entries, incl. `2058a164` |
  | `version` | 0.2.11 | 0.2.13 |
  | `bundled_in` | (absent) | bundle-78f4e2fe |

  Per-fact, HEAD wins on every conflicting fact and loses none: HEAD's
  `commits` list contains the incoming entry verbatim, and HEAD's status is
  downstream of `free_coded` in the lifecycle. Nothing was invented; no field
  present on only the incoming side exists.

  Timestamp tiebreak (per the auto-enrichment note, intent unknown on both
  sides) also points at HEAD. Note `git log -1 -- <path>` is misleading here:
  it reports `a93ac2acce` (author date 2026-08-24 14:32:02, *earlier* than the
  incoming 14:42:43), but that commit's only change to this file is a
  trailing-newline edit. The commit that actually introduced HEAD's conflicting
  frontmatter is `5a37f67dcd`, author date 2026-08-31 12:19:36 — later than the
  incoming commit. Confirmed with `git log -S 'free_and_reconciled' -- <path>`.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit touches
exactly one file (the ticket above, 7 insertions / 2 deletions, frontmatter
only) and no prose. The body merged cleanly and no incoming prose hunk was
dropped.

The incoming commit's key change — the `commits` entry recording
`working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc` together with a
`version` stamp — IS present in the staged result, arriving through HEAD's
later superset state rather than through this hunk. This is the
BUG-1109/BUG-1122 redundant-commit case, not a discard: the incoming intent
(record the free-coded SHA and advance the ticket past `free_coding`) is
already satisfied in HEAD, which has since advanced the same ticket to
`free_and_reconciled` at version 0.2.13.

Consequently `git diff HEAD` and `git diff --cached` are both empty: the
resolution is byte-identical to HEAD. Staged as instructed; per STEP 4 the
finalize step will detect the clean staged diff and skip the commit. No
`cherry-pick --continue/--skip/--quit/--abort`, `reset`, or `checkout <branch>`
was run — `CHERRY_PICK_HEAD` (`1eb1dd1586d5db0eb5aaa6f904a51b72f3a665d5`) is
still present.

No BUG-1301 precedence exception was invoked; no test functions were involved.
