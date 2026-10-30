---
uid: report-98c4c555
id: REPORT-5753
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T15:30:30.376206+00:00'
updated_at: '2026-09-30T15:30:30.376206+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-8e1807f6.md` — intent/bookkeeping ticket (bundle), rule **2e**. Resolved to the HEAD side.

  Three-way facts:

  | fact | base (`:1`) | ours / HEAD (`:2`) | theirs / incoming (`:3`) |
  |---|---|---|---|
  | `updated_at` | 2026-09-16T21:58:07 | **2026-09-19T15:19:02** | 2026-09-17T20:19:09 |
  | `status` | `reconciling` | **`free_and_reconciled`** | `ready_to_reconcile` |
  | `last_field_updated` | `status` | **`result`** | `status` (= base) |
  | `completed_at` | …58:59.383699 | **…58:58.377424** | = base (untouched) |
  | `fields.commits[4].reconcile_sha` | `null` | **`2cd4e586…`** | = base (untouched) |
  | `fields.skipped_commits`, `orphan_commits` (5), `regression_anchor_uid`, `merged_at_commit`, `session_assessor`, `session_assessor_started_at`, `result: pass` | absent | **present** | absent (= base) |

  Incoming's total delta against base is exactly two lines: `updated_at`
  and `status`. Both are facts HEAD also changed, so per 2e the
  later-positioned intent wins **per fact** — HEAD's `updated_at`
  (2026-09-19) is 2 days later than incoming's (2026-09-17), and HEAD's
  `status: free_and_reconciled` is strictly downstream of incoming's
  `ready_to_reconcile` in the bundle lifecycle
  (`ready_to_reconcile` → `reconciling` → `free_and_reconciled`).
  Taking incoming here would rewind the bundle two lifecycle states.

  Every other field incoming left at its base value, and HEAD advanced —
  so HEAD is a strict superset outside the two contested facts. No
  incoming field, section, or body text is dropped by this resolution:
  the document bodies are byte-identical on all three stages.

  Net staged diff against HEAD is empty. Per STEP 4 this is left for
  Python's finalize step to detect and skip; `--skip` was not called here.

## Incoming changes preserved

No code or implementation files were in this conflict — the sole
conflicting path is an intent/bookkeeping ticket, governed by the
per-fact timeline rule (2e) rather than by incoming-authoritative (2c).
The BUG-1301 precedence exception was not invoked; no hunk was dropped
on refactor grounds.

Incoming's two contested facts (`updated_at`, `status`) are superseded
by HEAD's later-positioned values on the same facts, which is the
documented 2e outcome and not data loss: the state incoming records
(`ready_to_reconcile`) is an earlier point on the same lifecycle that
HEAD has already carried forward past.
