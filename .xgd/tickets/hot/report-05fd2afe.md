---
uid: report-05fd2afe
id: REPORT-5308
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:56:05.282702+00:00'
updated_at: '2026-09-28T06:56:05.282702+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, file class **2e** (intent/bookkeeping
  ticket under `.xgd/tickets/`; `type: bundle`, so not a matrix-defining spec ticket and
  rule 2d's ledger-replay does not apply). **Rule applied: ours**, which is the
  later-positioned intent per-fact.

  Cherry-pick of `e126b1aa2b` (`xgd(ticket): update bundle bundle-b3b7c399`, author date
  2026-08-30) onto HEAD `c88aed46b0`. The file *was* materialised on disk with real
  conflict markers (lines 8–18) despite `.xgd/tickets/` being outside the sparse-checkout
  cone — see the staging note below.

  Only four adjacent frontmatter scalars conflicted. The incoming commit's entire diff is
  two lines (`updated_at` bump, `ready_to_reconcile` → `reconciling`); git widened the hunk
  because ours also changed the adjacent `completed_at` / `last_field_updated`:

  | field                | base (1)              | ours (2)                     | incoming (3)          |
  |----------------------|-----------------------|------------------------------|-----------------------|
  | `updated_at`         | 2026-08-31T05:04:25   | **2026-08-31T14:23:04**      | 2026-08-31T05:05:42   |
  | `completed_at`       | `null`                | **2026-08-31T14:22:24**      | `null`                |
  | `last_field_updated` | `status`              | **`result`**                 | `status`              |
  | `status`             | `ready_to_reconcile`  | **`free_and_reconciled`**    | `reconciling`         |

  All four are the *same fact* (this bundle's lifecycle position) changed on both sides, so
  2e's genuine-conflict branch governs and the later-positioned intent wins. Both sides
  advanced the same base along one path:

      ready_to_reconcile  →  reconciling  →  free_and_reconciled
      (base)                 (incoming)       (ours)

  Ours is strictly further along, newer by ~9h, and additionally carries a non-null
  `completed_at`.

  Tie-break note: 2e prescribes `xgd working-timeline <uid_HEAD> <uid_INCOMING>`, but both
  sides are the *same* uid (`bundle-b3b7c399`) — that command has no two-uid input here, so
  the ordering was taken from `updated_at` / commit timestamp, matching the auto-enrichment's
  stated rule ("Intent unknown on one or both sides. Take the more recent commit by
  timestamp and flag this file for post-merge review").

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping
ticket. No UAT test file was touched, so 2f is not engaged and the BUG-1301 PRECEDENCE
exception was **not** invoked; no hunk was dropped under it.

The incoming side's two-line delta is **subsumed rather than discarded**: `reconciling` is an
intermediate status this bundle has since passed through on the ours side, and its
`updated_at` is older than ours. Taking incoming for that hunk would have regressed
`free_and_reconciled` → `reconciling` and nulled out `completed_at`.

Corroboration from the part of the file that auto-merged cleanly (and so never surfaced as a
conflict): incoming still carries the bundle's ~100 open per-commit entries —

      - working_sha: de2e299302…
        reconcile_sha: null
        main_sha: null
        working_sha_history: []
      … ×100

— while ours has collapsed all of them into the single reconciled end state:

      - working_sha: null
        reconcile_sha: null
        main_sha: eef7a8b48bfa15c54b64db9541a0e781a016ba9e

That collapse is precisely what `free_and_reconciled` denotes. Taking incoming for the
frontmatter hunk would have produced an internally inconsistent ticket: `status: reconciling`
alongside a `commits` list already showing the reconcile finished.

## Staging notes

    git checkout --ours --ignore-skip-worktree-bits -- .xgd/tickets/hot/bundle-b3b7c399.md
    git add --sparse -- .xgd/tickets/hot/bundle-b3b7c399.md

Two sparse-cone details, each of which cost a failed attempt:

- Plain `git checkout --ours` printed `The following paths ... exist outside of your
  sparse-checkout definition, so will not be updated in the index` and left all three stages
  in place. `git checkout` has **no** `--sparse` flag (that spelling belongs to `git add`;
  checkout exits 129 with ``unknown option `sparse'``) — the correct flag is
  `--ignore-skip-worktree-bits`.
- `git add` without `--sparse` then silently refuses the same path.

Because this file *had* materialised on disk with real markers, the marker-free working file
was not evidence the resolution was staged; `git ls-files -u` was.

Verified after staging: no unmerged stages remain, zero conflict markers in the staged blob,
and stage 0 is ours exactly (`git diff --cached HEAD` empty for this path) — not a
hand-merged hybrid.

## Note for the sequencer

`git diff --cached HEAD` is now **empty**: HEAD already contains a strictly later state of
this ticket, so the pick has become a no-op. This is the expected empty-cherry-pick shape,
not a lost change. Per instructions the sequencer was **not** advanced — no `--continue`,
`--skip`, `--quit`, or `--abort` was issued, and `CHERRY_PICK_HEAD` is still live at
`e126b1aa2b`. Python's finalize step should detect the clean staged diff and skip the commit.

## Flagged for post-merge review

Per the auto-enrichment rule, `.xgd/tickets/hot/bundle-b3b7c399.md` is flagged: both sides
carried the same commit subject with no distinguishing intent metadata, so the resolution
rests on lifecycle ordering plus the `commits`-list corroboration above rather than on a
declared intent.
