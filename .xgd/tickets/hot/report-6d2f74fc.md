---
uid: report-6d2f74fc
id: REPORT-4173
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:27:13.076858+00:00'
updated_at: '2026-09-13T23:27:13.076858+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158) — **UU**, intent/bookkeeping
  ticket (`request-*`), so **rule 2e** applies, not 2d (2d covers
  story/acceptance_criterion/capability only; this file lives under `hot/` but is
  a `request`). Path is outside the sparse-checkout cone, so the conflict existed
  only in the index with no working-tree markers — resolved with
  `git checkout --ours` + `git add --sparse` per STEP 4/DOC-986 §2.

  Single conflict hunk, confined to four frontmatter lines. Both sides changed the
  **same fact** (`status`), so 2e's per-fact timeline tiebreak governs:

  | side | commit | working-timeline | `status` |
  |---|---|---|---|
  | ours (HEAD) | `c94654a3` seed_local_overlay | 2026-09-09T21:35:22Z | `bundled` |
  | incoming | `58d4f8ec` update | 2026-09-01T18:53:35Z | `free_coded` |

  `xgd working-timeline c94654a3 58d4f8ec` confirms ours is the later-positioned
  intent (1788989722 > 1788288815). **Kept ours** for that fact. No other fact was
  in conflict; the prose body — including the "What has changed under this ticket"
  and Q1–Q4 sections — merged cleanly and is untouched. `git diff HEAD` after the
  checkout was empty, confirming no auto-merged incoming content was dropped.

## Incoming changes preserved

No code or implementation files were in this conflict — the sole conflicted path is
a bookkeeping ticket, so STEP 3's code-file verification has no targets and the
BUG-1301 precedence exception was not invoked. No test function on either side was
deleted.

On the ticket fact itself: the incoming commit's whole diff was
`status: ready_to_reconcile → free_coded` plus its `updated_at` bump. That change is
**present via a different route, not discarded** — the Sep 9 overlay seed carries the
ticket's downstream state `bundled`, which is reached *through* `free_coded`. The
ticket's own fields corroborate that the free-coding step completed and was
superseded: `fields.bundled_in: bundle-87be4669` is set, and
`fields.commits[0].working_sha = 2745001058…` is recorded with `reconcile_sha: null`
(free-coded, bundled, reconcile not yet done). Reinstating `free_coded` would have
regressed the ticket's lifecycle by eight days.

The staged diff is consequently **empty vs HEAD** — the redundant-commit case of
STEP 4 (BUG-1109/BUG-1122), not the discarded case of STEP 3. Per instruction, no
`--skip` was called; the finalize step should detect the clean staged diff and skip
the commit. `CHERRY_PICK_HEAD` (`58d4f8ec…`) is intact and untouched.

## Flagged for post-merge review

The auto-enrichment classed this file as *"intent unknown on one or both sides —
take the more recent commit by timestamp and flag this file for post-merge review."*
Timestamp resolution was applied as directed; **flagging REQ-158 accordingly.** The
specific thing a reviewer should confirm is that REQ-158's status is legitimately
`bundled` on the reconcile branch and that no intervening working-side status
transition between Sep 1 and Sep 9 was lost behind the overlay seed, which collapses
`draft → bundled` into a single commit and therefore does not itself show the
intermediate steps.
