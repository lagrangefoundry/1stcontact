---
uid: report-fae94006
id: REPORT-4727
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:13:24.799598+00:00'
updated_at: '2026-09-21T14:13:24.799598+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` (REQ-163, "Ingestion: from a dropped
  file to an indexed `material` ticket") — **UU**, intent/bookkeeping ticket
  (STEP 2e). Resolved by taking the HEAD-side blob `a8c14c1e` verbatim.

  Both sides diverge from base `c16290fd` (`status: free_coded`):

  | fact | ours (HEAD) | theirs (CHERRY_PICK_HEAD `e1541ec5`) |
  |---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` |
  | `updated_at` | `2026-09-09T21:32:49Z` | `2026-09-01T03:36:07Z` |
  | `fields.bundled_in` | `bundle-87be4669` (added) | absent |
  | body: stray blank line after front-matter | removed | removed |
  | EOF newline | added | absent |

  Rule applied, per fact:

  - **Body edit** — both sides made the *identical* change (drop the blank line
    after the closing `---`). Not a competing fact; the incoming edit is
    present in the resolved file.
  - **`status` / `updated_at`** — the one genuinely competing fact. Resolved by
    2e's later-positioned-intent rule rather than by raw `updated_at`
    comparison. The HEAD-side fact originates in `d58e8e3f`
    (`xgd(ticket): seed_local_overlay`, working-timeline position
    `2026-09-09T21:35:22Z`); the incoming fact originates in `e1541ec5`
    (working-timeline position `2026-09-01T03:36:07Z`). HEAD is later by eight
    days, so `bundled` wins. `bundled` is also downstream of
    `ready_to_reconcile` in the lifecycle, so this is a forward move, not a
    regression.
  - **`fields.bundled_in`** — a HEAD-only addition with no incoming
    counterpart; kept. Discarding it would strand `bundle-87be4669`, which
    would still claim a ticket that no longer recorded membership.
  - **EOF newline** — HEAD-only whitespace fix; kept.

  `xgd ticket get request-439cd0c8` independently reports
  `Status: bundled` / `bundled_in: bundle-87be4669`, matching the resolved
  blob.

  The conflicted path is outside the sparse-checkout cone (worktree is at 11%
  of tracked files; the file had no working-tree copy, only index stages), so
  it was materialized from the stage-2 blob and staged with `git add --sparse`
  per DOC-986 §2/§4.1.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is
a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification
applies only in the ticket sense. Checked anyway:

- `git show e1541ec5 -- .xgd/tickets/hot/request-439cd0c8.md` contains exactly
  two changes: the `status`/`updated_at`/`last_field_updated` transition and
  the blank-line removal.
- The blank-line removal **is present** in the resolved file (both sides made
  it identically).
- The `status` transition is **intentionally superseded**, not discarded — see
  the per-fact rule above. This is 2e's documented genuine-intent-conflict
  branch, not a dropped hunk, so the BUG-1301 PRECEDENCE exception is not
  invoked and no exception accounting is required.

No UAT test functions were touched; no test deletion occurred.

## Staging state

`git status --porcelain` is **empty**: the resolved tree is byte-identical to
HEAD, because HEAD already carried the winning version of every fact. Per
STEP 4 this is expected and is NOT a reason to call `--skip` — the finalize
step detects the clean staged diff and skips the commit itself.

`CHERRY_PICK_HEAD` remains present at `e1541ec5c212a31ff5200bf0339726ffc166500c`.
No `--continue` / `--skip` / `--quit` / `--abort` was issued.
