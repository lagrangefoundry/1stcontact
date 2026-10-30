---
uid: report-1e97e13f
id: REPORT-5490
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:13:04.377116+00:00'
updated_at: '2026-09-29T07:13:04.377116+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, class 2e
  (intent/bookkeeping ticket, `request-*`). Incoming commit is
  `8760eac3104d25f377bac302bb62a2342b20b995`, *"xgd(ticket): update
  request request-8b33a146"* (Tue Sep 1 14:34:31 2026), the immediate
  successor to the `4305ac944e` pick resolved in the previous attempt
  — its merge base here (`180dc007d3`) is that commit's blob.

  The path sits outside the sparse-checkout cone (patterns `/*`,
  `!/.xgd/tickets/`, `!/.xgd/tickets/**` — DOC-986 §2/§4.1), so the
  conflict lived only in the index with no working-tree markers.
  Resolved with `git update-index --cacheinfo` to the ours-side blob
  `284e1e08f9`, then `git update-index --skip-worktree` to restore the
  sparse bit that `--cacheinfo` clears.

  **Rule applied.** `git diff 284e1e08f9 09f46fb895` confines the
  divergence to frontmatter plus a trailing-newline change; the body
  is otherwise byte-identical. Resolved per-fact, not whole-file:

  | fact | ours (HEAD) | theirs (`8760eac310`) | taken |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `free_coded` | ours |
  | `completed_at` | `2026-09-14T10:29:05` | `null` | ours |
  | `updated_at` | `2026-09-19T15:15:29` | `2026-09-01T21:34:31` | ours |
  | `last_field_updated` | `status` | `status` | identical |
  | `fields.commits` | 2 working SHAs | same 2 SHAs | identical |
  | `fields.version` | `0.2.37` | `0.2.37` | identical |
  | `fields.bundled_in` | `bundle-8e1807f6` | absent | ours |
  | trailing newline | present | stripped | ours |
  | body (all sections) | — identical — | — identical — | either |

  On every contested fact the HEAD side is later in both wall-clock
  time (09-19 vs 09-01, eighteen days) and lifecycle position
  (`free_and_reconciled` is downstream of `free_coded`), or is a
  strict superset (`bundled_in` exists only on HEAD). No fact favours
  the incoming side, so nothing is taken from theirs. This lands on
  the same answer as the auto-enriched rule ("take the more recent
  commit by timestamp"), reached per-fact as 2e requires.

  The one non-frontmatter difference — incoming strips the file's
  terminating newline — is cosmetic, not a fact. Keeping ours
  preserves the POSIX-conventional trailing newline and matches HEAD.

  Flagged for post-merge review per the enrichment metadata, though
  the practical risk is nil: the resolution is byte-identical to HEAD.

## Incoming changes preserved

- `.xgd/tickets/hot/request-8b33a146.md` — **fully subsumed.**
  `git show 8760eac310 --stat` reports this commit's entire
  contribution as `12 insertions(+), 4 deletions(-)` in this one
  file. Measured against its own base (`git diff 180dc007d3
  09f46fb895`), that contribution is exactly four things:
  `status: free_coding` → `free_coded`; `last_field_updated: body` →
  `status`; the addition of `fields.commits` (two entries,
  `eb6655c337` and `324b55bf19`) and `fields.version: 0.2.37`; and an
  `updated_at` bump. It touches no body text.

  Three of those four are present verbatim in the staged blob —
  `fields.commits` with the identical two working SHAs, and
  `fields.version: 0.2.37`, and `last_field_updated: status`. The
  fourth, `status: free_coded`, is not merely present but **already
  superseded**: HEAD carries `free_and_reconciled`, the state REQ-172
  reached *after* `free_coded`, together with the `completed_at` and
  `bundled_in` that accompany it. Advancing the ticket to `free_coded`
  is precisely what this commit set out to do, and HEAD records that
  it happened and then moved on.

  No hunk was dropped, so the BUG-1301 precedence exception does not
  apply and is not invoked. Nothing incoming is discarded except a
  stale `updated_at`/`completed_at` pair and a lifecycle state HEAD
  has already passed through — a per-fact loss under the 2e timeline
  rule, not a discard of developer code. No body text, no code, and
  no test content is involved anywhere in this conflict.

  Consequence for the next step: the resolution equals HEAD exactly,
  so `git diff --cached HEAD` is empty and this cherry-pick has no net
  effect. Per STEP 4 that is left alone — no `--skip` was called; the
  finalize step will detect the clean staged diff and skip the commit
  itself.

## Verification

- `git status --porcelain` — empty; no `UU`/`AA`/`DU`/`UD` remaining,
  no stray worktree modifications.
- `git ls-files -sv <path>` — `S 100644 284e1e08f9 0`, i.e. fully
  resolved at stage 0 with skip-worktree restored, so the sparse
  checkout is not left reporting the file as deleted.
- `git diff --cached HEAD --stat` — empty, confirming the staged tree
  matches HEAD.
- `CHERRY_PICK_HEAD` still present at `8760eac3104d25f377bac302bb62a2342b20b995`
  — the in-progress cherry-pick was not continued, skipped, quit, or
  aborted.
