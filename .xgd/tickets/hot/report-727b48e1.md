---
uid: report-727b48e1
id: REPORT-4406
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:41:45.411054+00:00'
updated_at: '2026-09-19T11:41:45.411054+00:00'
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

  Incoming commit: `d22ba37c` `xgd(ticket): update bug bug-3ade1af4`
  (2026-09-01 12:34:04 -0700).
  HEAD side: `af0186bf` `xgd(ticket): seed_local_overlay bug bug-3ade1af4`
  (2026-09-17 13:23:48 -0700) — the more recent commit by timestamp, which is
  the side the enrichment rule selects.

  Fourth consecutive commit in this run touching only this ticket; the sequencer
  advanced again (base stage is `50c13659`, attempt 128's incoming side).
  Bodies remain byte-identical across all stages.

  Facts, against base `50c13659`:

  | fact | base | incoming `75787399` | HEAD `1f50971c` |
  |---|---|---|---|
  | `status` | `free_coded` | **`ready_to_reconcile`** | **`bundled`** (downstream) |
  | `last_field_updated` | `title` | `status` | `status` (= incoming) |
  | `updated_at` | 09-01T19:30:16 | 09-01T19:34:04 | **09-16T01:48:35** |
  | `completed_at` | `null` | unchanged | **2026-09-14T10:29:13** |
  | `fields.bundled_in` | absent | unchanged | **`bundle-8e1807f6`** |
  | `title` | "27 failures…" | unchanged | identical |
  | `fields.commits` / `version` / `story_points` | present | unchanged | identical |

  `last_field_updated` now agrees on both sides (`status`), so the tension noted
  in the previous two reports does not arise here. The only same-fact conflicts
  are `status` and `updated_at`, and HEAD is later on both.

## Incoming changes preserved

`git show d22ba37c -- .xgd/tickets/hot/bug-3ade1af4.md` makes one substantive
change: `status: free_coded → ready_to_reconcile`. That transition is present in
HEAD via a later route, and the evidence is structural rather than inferential:

- HEAD reads `status: bundled` with `fields.bundled_in: bundle-8e1807f6`.
- `.xgd/tickets/hot/bundle-8e1807f6.md` at HEAD is **BUNDLE-27**, titled
  "REQ-155 + BUG-40 + REQ-160 + BUG-41 + BUG-42 + 3 more" — BUG-40 is a member
  of the very bundle this reconcile run is cherry-picking.
- A ticket is gathered into a reconcile bundle only after it reaches
  `ready_to_reconcile`; `bundled` is the state it takes on once gathered. So the
  incoming commit's transition is a prerequisite that demonstrably already
  happened — HEAD is past it, not short of it.

The remaining lines:

- `last_field_updated: title → status` — **present verbatim** on HEAD.
- `updated_at: 19:30:16 → 19:34:04` — present via a later route; HEAD carries a
  strictly later stamp (2026-09-16T01:48:35).
- `completed_at` stays `null` on the incoming side; HEAD has it set
  (2026-09-14), consistent with the later lifecycle position.

No hunk was dropped under the BUG-1301 precedence exception; no test file was
involved.

## Note on the net diff

The staged tree has **no diff vs HEAD** (`git status --porcelain` and
`git ls-files -u` are both empty). STEP 4's redundant-commit case, fourth in a
row for this ticket (after `08bbde06`, `d975830c`, `cb4ece92`). The whole run of
four is one ticket's working-side lifecycle trail — `free_coding` → `free_coded`
→ story-points touch → title rewrite → `ready_to_reconcile` — every step of which
HEAD already holds, having been seeded at `bundled` by commit `7d4b20a3`
(2026-09-11) before this cherry-pick sequence began.

`--skip` was not called; `CHERRY_PICK_HEAD` (`d22ba37c`) is intact for
`cherry_pick_finalize_resolution`.

## Post-merge review flag

Flagging `.xgd/tickets/hot/bug-3ade1af4.md` for post-merge review, as the
enrichment rule requires when intent is unknown on one side: BUG-40 reads
`bundled` into `bundle-8e1807f6` with `completed_at` set on the reconcile
branch, while the working-side history still carries it at
`ready_to_reconcile`. HEAD's values are the correct ones.
