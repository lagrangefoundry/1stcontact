---
uid: report-1a955a34
id: REPORT-5276
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:22:50.470249+00:00'
updated_at: '2026-09-28T03:22:50.470249+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, file class **2e** (intent/bookkeeping
  ticket under `.xgd/tickets/`; `bug-*`, not a matrix-defining spec ticket).
  Rule applied: per-fact timeline — later-positioned intent wins, per fact.
  Resolved to the ours/HEAD blob `6d962ce5` in full.

  The path is outside this worktree's sparse-checkout cone
  (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so the conflict existed only in the
  index with no working-tree markers. Resolved with `git checkout --ours --`
  followed by `git add --sparse --` (plain `git add` refuses paths outside the
  cone; `checkout --ours` materialized the file but left all three stages in
  place, so the `add` was load-bearing, not cosmetic).

  Every fact at issue is a single frontmatter field, and on each one the ours
  side is strictly later:

  | field | base (`785e0a5e`) | incoming (`226541c7`) | ours (`6d962ce5`) |
  |---|---|---|---|
  | `status` | `free_coded` | `ready_to_reconcile` | `free_and_reconciled` |
  | `updated_at` | 2026-08-24T01:50 | 2026-08-25T22:52 | 2026-08-31T19:19 |
  | `completed_at` | null | null | 2026-08-31T19:19 |
  | `bundled_in` | — | — | `bundle-78f4e2fe` |

  Both sides move the same ticket along one lifecycle path,
  `free_coded → ready_to_reconcile → bundled → free_and_reconciled`. The
  incoming commit advances `free_coded → ready_to_reconcile` — it is the
  *request* to reconcile. Ours is six days later and has already *completed*
  that reconcile, stamping `completed_at` and recording the bundle linkage
  `bundled_in: bundle-78f4e2fe`. Taking incoming per-fact would have regressed
  `status`, nulled `completed_at`, and dropped `bundled_in`.

  This also agrees with the auto-enrichment's fallback rule for this file
  ("intent unknown on one or both sides — take the more recent commit by
  timestamp"): ours is the more recent side on every contested field.

  Flagged for post-merge review per that same enrichment note, though the
  scope of what needs reviewing is narrow — see below.

## Incoming changes preserved

No code files were in conflict — the single conflicted path is a ticket
markdown file, so STEP 3's `git show $CPHEAD -- <file>` code-preservation
check does not apply, and the BUG-1301 precedence exception was not invoked
anywhere in this resolution. No test function on either side was deleted.

A direct ours-vs-theirs blob diff confirms the two sides differ **only** in the
four frontmatter fields tabulated above, plus a trailing-newline fix on the
ours side. All 370 lines of body prose (Symptom, repro, analysis, and the
closing note about the separate Edit-mode segment-budget issue) are
byte-identical between the two sides. There is no prose, no field, and no
section present on the incoming side that is absent from the resolved version,
so nothing developer-authored was discarded: the incoming frontmatter facts are
*superseded* by strictly-later values of the same fields, not dropped.

## Consequence for the sequencer

`git diff --cached HEAD` is empty — this resolution leaves the staged tree
identical to HEAD, because HEAD already carries a strictly later state of the
only file `486ef694` touches. Per STEP 4 I have staged and stopped rather than
calling `--skip`; the finalize step is expected to detect the clean staged diff
and skip the commit. The empty diff is the correct outcome here, not a lost
change.

## Verification

- `git status --porcelain` — empty; no conflict-class (UU/AA/DU/UD) lines remain.
- `git ls-files -u` — empty; no unmerged stages.
- `git ls-files -s` — single stage-0 entry at `6d962ce5`.
- `git hash-object` on the materialized worktree copy — `6d962ce5`, matching the
  ours blob exactly.
- `git rev-parse --verify CHERRY_PICK_HEAD` — still `486ef694`; the in-progress
  cherry-pick is untouched. No `--continue`, `--skip`, `--quit`, or `--abort`
  was run.
