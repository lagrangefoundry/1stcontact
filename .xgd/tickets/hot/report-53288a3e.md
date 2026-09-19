---
uid: report-53288a3e
id: REPORT-4405
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:39:22.101548+00:00'
updated_at: '2026-09-19T11:39:22.101548+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **UU**, rule **2e** (intent/bookkeeping
  ticket; `bug-*`, lives in `hot/`). Out of the sparse-checkout cone, so the
  conflict existed only in the index with no working-tree markers. Resolved to
  the HEAD side, staged with `git add --sparse`.

  Incoming commit: `cb4ece92` `xgd(ticket): update bug bug-3ade1af4`
  (2026-09-01 12:30:16 -0700).
  HEAD side: `af0186bf` `xgd(ticket): seed_local_overlay bug bug-3ade1af4`
  (2026-09-17 13:23:48 -0700) — the more recent commit by timestamp, which is
  the side the enrichment rule selects.

  This is the third consecutive commit in this run touching only this ticket;
  the sequencer has advanced each time (base stage is `4df13eff`, which was
  attempt 127's incoming side). Bodies remain byte-identical across all stages.

  Facts, against base `4df13eff`:

  | fact | base | incoming `50c13659` | HEAD `1f50971c` |
  |---|---|---|---|
  | `title` | "23 failures… ten UATs" | **"27 failures + 30 collection errors… eleven UATs"** | **identical to incoming** |
  | `updated_at` | 09-01T19:28:25 | 09-01T19:30:16 | **09-16T01:48:35** |
  | `last_field_updated` | `story_points` | `title` | `status` |
  | `status` | `free_coded` | unchanged | **`bundled`** |
  | `completed_at` | `null` | unchanged | **2026-09-14T10:29:13** |
  | `fields.bundled_in` | absent | unchanged | **`bundle-8e1807f6`** |
  | `fields.commits` / `version` / `story_points` | present | unchanged | identical |

  The incoming commit's one substantive change is the **title rewrite**, and
  HEAD already carries that new title byte-for-byte — it reached the reconcile
  branch ahead of this pick. Nothing of it is lost.

  The remaining three lines are lifecycle bookkeeping on which HEAD is strictly
  ahead. `updated_at` is a same-fact conflict, decided by timeline in HEAD's
  favour (09-16 vs 09-01). `last_field_updated` is resolved as one fact with
  `updated_at`, not independently: the pair states "the most recent field update
  was X, at time T". Grafting incoming's `title` onto HEAD's 09-16 stamp would
  assert that the 2026-09-17 `seed_local_overlay` commit rewrote the title,
  which it did not — a pairing present on neither side, and 2e prohibits
  inventing content not on either side. HEAD's `(status, 09-16T01:48:35)` is the
  true pairing: that commit advanced `status` to `bundled`.

## Incoming changes preserved

`git show cb4ece92 -- .xgd/tickets/hot/bug-3ade1af4.md`:

- **`title` → "Test suite: 27 failures + 30 collection errors — a half-finished
  install, a stale asset build, and eleven UATs superseded by later work"** —
  present in the resolved file **verbatim**, including the line wrap. This is
  the commit's entire content change and it survives intact.
- `updated_at: 19:28:25 → 19:30:16` — present via a later route; HEAD carries a
  strictly later stamp.
- `last_field_updated: story_points → title` — a pointer naming which field the
  bump touched. The field it names, `title`, already holds the incoming value on
  HEAD, so the pointer's referent is preserved even though the pointer itself is
  not carried, for the reason above.
- `status` remains `free_coded` on the incoming side and has already advanced
  past it to `bundled` on HEAD, so no lifecycle state is rolled back.

No hunk was dropped under the BUG-1301 precedence exception; no test file was
involved.

## Note on the net diff

The staged tree has **no diff vs HEAD** (`git status --porcelain` and
`git ls-files -u` are both empty). This is the redundant-commit case in STEP 4,
and here the evidence separating it from STEP 3's discard case is direct rather
than inferential: the commit's only content change is a title string, and that
exact string is what HEAD already reads. Third empty net in a row for this
ticket (after `08bbde06` at attempt 126 and `d975830c` at 127), consistent with
HEAD holding BUG-40's whole working-side history plus the later `bundled`
transition.

`--skip` was not called; `CHERRY_PICK_HEAD` (`cb4ece92`) is intact for
`cherry_pick_finalize_resolution`.

## Post-merge review flag

Flagging `.xgd/tickets/hot/bug-3ade1af4.md` for post-merge review, as the
enrichment rule requires when intent is unknown on one side: BUG-40 reads
`bundled` into `bundle-8e1807f6` with `completed_at` set on the reconcile
branch, while the working-side history still carries it at `free_coded`.
HEAD's values are the correct ones, and the title now agrees on both sides.
