---
uid: report-7302cbc5
id: REPORT-4082
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:55:40.720067+00:00'
updated_at: '2026-09-11T22:55:40.720067+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` (REQ-147) — class **UU**, rule **2e**
  (intent/bookkeeping ticket; `request-*`, not a spec ticket, so 2d's
  ledger-replay does not apply). Single conflict hunk, ticket lifecycle
  metadata only. No code, no body/content change on either side.
  **Resolved toward OURS (HEAD).**

  The hunk carries one fact-cluster — a status transition and its two
  timestamps. Both sides diverge from the same base (`status: reconciling`,
  `updated_at: 2026-08-20T12:51:32`):

  | fact | incoming `95ffc177ff` | HEAD |
  |---|---|---|
  | `status` | `ready_to_reconcile` | `free_and_reconciled` |
  | `completed_at` | `null` | `2026-08-31T14:22:44` |
  | `updated_at` | `2026-08-24T01:15:24` | `2026-08-31T14:22:44` |

  `last_field_updated: status` is identical on both sides. There are no
  non-overlapping fields or sections to combine — 2e's "apply BOTH" and
  "keep the superset" branches do not apply. This is 2e's third branch:
  the SAME fact changed differently on each side, so the per-fact timeline
  rule governs.

  The auto-enrichment reported intent unknown on both sides (both subjects
  are the generic `xgd(ticket): update request request-23fd6e61`), so
  `xgd working-timeline` had no intent uids to position and its prescribed
  fallback applies: take the more recent commit by timestamp. HEAD is later
  on every available measure:

  - HEAD-side commits touching this file: `e0ffd3bf` 2026-08-30 22:06:22
    (seed_local_overlay, `reconciling` → `bundled`) and `02c0d390`
    2026-08-31 07:22:44 (`bundled` → `free_and_reconciled`).
  - Incoming `95ffc177ff`: 2026-08-23 18:15:24 — seven days earlier.
  - Even by the tickets' own embedded stamps, HEAD's `bundled` transition
    (`updated_at 2026-08-24T02:10:41`) postdates the incoming's
    `ready_to_reconcile` (`2026-08-24T01:15:24`) by 55 minutes.

  Taking incoming would have rolled a completed ticket backwards through
  its own lifecycle — `free_and_reconciled` → `ready_to_reconcile` — and
  nulled out the `completed_at` stamp, reverting an operator-owned status
  field. HEAD's state is the downstream one: this ticket is bundled into
  `bundle-b3b7c399` and already reconciled.

  Per the enrichment's instruction for unknown-intent conflicts, this file
  is **flagged for post-merge review**.

## Incoming changes preserved

No code or implementation files were in this conflict, so STEP 3's
code-discard guard has no code file to check. For completeness, the
disposition of the incoming commit's only change:

`95ffc177ff` changed exactly two lines in one file — `status` to
`ready_to_reconcile` and its `updated_at` stamp. That value is not present
in the resolved file, and its absence is **supersession, not a discard**:

- The incoming side carries no developer code, no body text, and no field
  the HEAD side never touched. Its entire payload is one automated
  lifecycle-status bookkeeping transition.
- `ready_to_reconcile` is an earlier stage of the reconcile lifecycle than
  HEAD's `free_and_reconciled`. The HEAD timeline advanced this same
  ticket past that point through a different route (`reconciling` →
  `bundled` → `free_and_reconciled`), which is the BUG-1109/BUG-1122 shape:
  a later sync already carried the ticket's lifecycle forward, so this
  commit's effect is redundant rather than lost.
- Nothing the developer authored is dropped. Re-applying the incoming
  value would not restore intent; it would regress state.

Resolution nets to no diff vs HEAD. Per STEP 4 this is expected and is not
a `--skip` trigger — the tree is staged and left for
`cherry_pick_finalize_resolution` to detect the clean staged diff.

## Git state left for finalize

- Resolved and staged via `git add --sparse` (`.xgd/tickets/` is outside
  the sparse-checkout cone — DOC-986 §2/§4.1).
- `git ls-files -u` reports 0 unmerged stages; no conflict markers remain
  in the working-tree file.
- `git status --porcelain` is empty (index matches HEAD — the no-net-change
  case above).
- `CHERRY_PICK_HEAD` intact at `95ffc177ff2251089cb173a560162260633b4a9d`.
  No `--continue`, `--skip`, `--quit`, `--abort`, `reset`, or `checkout
  <branch>` was run.
