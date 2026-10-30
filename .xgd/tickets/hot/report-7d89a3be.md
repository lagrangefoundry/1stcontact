---
uid: report-7d89a3be
id: REPORT-4588
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:09:38.510257+00:00'
updated_at: '2026-09-21T00:09:38.510257+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket (§2e),
  sparse-excluded (index-only conflict, no working-tree markers; resolved via
  index per STEP 4's `--sparse` guidance). Resolved to the HEAD-side blob
  `6d962ce5db`.

  The auto-enrichment marked intent "unknown on one or both sides" and
  prescribed the timestamp fallback. Reading the intent ledger on both sides
  made the fallback unnecessary — this is not a competing edit at all:

  - Incoming `da0fccd35b` sets `updated_at=2026-08-26T17:36:27.054996+00:00`,
    `status: draft → bundled`, and adds `fields.bundled_in: bundle-78f4e2fe`.
  - HEAD's ledger already contains that exact change at
    `7a8d0abd29 xgd(ticket): seed_local_overlay bug bug-db356ff8` — same
    `updated_at` to the microsecond, same status transition, same `bundled_in`,
    same 370-line body. The seed_local_overlay step replayed the incoming
    commit onto the resync branch through a different path.
  - HEAD then advanced it two further steps along the same ledger:
    `56ced613a4` (`bundled → free_and_reconciled`, sets `completed_at`) and
    `6c094224fb` (trailing-newline fix).

  So HEAD is strictly downstream of the incoming side on one shared ledger,
  not divergent from it. Per §2e the per-fact resolution is:
  `bundled_in` — identical on both sides, no conflict;
  `status` / `updated_at` / `completed_at` — same fact, later-positioned
  intent wins, which is HEAD.

  Corroboration that the downstream state is the live one: the anchor
  `bundle-78f4e2fe` is itself `free_and_reconciled` and merged to main at
  `96a76934e0`; `xgd ticket get bug-db356ff8` reports `free_and_reconciled`
  with `bundled_in: bundle-78f4e2fe`; and sibling member `bug-6612c4b7` of the
  same bundle carries the identical terminal shape.

  This is the case STEP 4 anticipates — "an earlier commit in this resync
  queue already landed the same effect through a different path." The staged
  diff against HEAD is empty; finalize should skip the commit.

## Incoming changes preserved

No code/implementation files were in conflict, so no STEP 3 code verification
applies and the BUG-1301 precedence exception was not invoked — nothing was
dropped.

For the one ticket file, the incoming commit's only additive fact —
`fields.bundled_in: bundle-78f4e2fe` — is present verbatim in the resolved
blob. Its other two edits (`status: bundled`, `updated_at: 2026-08-26`) are
same-fact writes that HEAD's own ledger already superseded at `56ced613a4`,
having first applied them at `7a8d0abd29`. The 370-line ticket body arrived
with that same seed commit and is byte-identical on both sides (verified:
`git diff` between the two blobs touches only the status/timestamp lines and
the trailing newline).

## Staging state

- `git status --porcelain` — empty; no UU/AA/DU/UD lines remain.
- `git ls-files -u` — no unmerged entries.
- Stage-0 blob for the path is `6d962ce5db`.
- `skip-worktree` restored to `S`, matching every sibling under
  `.xgd/tickets/hot/` (it was cleared as a side effect of resolving the index
  entry directly, which briefly made the sparse-excluded file read as deleted).
- `CHERRY_PICK_HEAD` intact at `da0fccd35b845e49756aaf48af28cd175fed53e9`;
  no `--continue` / `--skip` / `--quit` / `--abort` was run.
