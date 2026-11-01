---
uid: report-7341fb17
id: REPORT-7361
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:15:48.053745+00:00'
updated_at: '2026-11-01T06:15:48.053745+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-20bd7d63.md` (REQ-166): intent/bookkeeping ticket (2e), handled per fact.
  - **Header block** (`updated_at`, `completed_at`, `last_field_updated`, `status`): kept HEAD. HEAD's values (2026-11-01, `free_and_reconciled`, completed) are the later state. The incoming commit 98fd8ebabc is from 2026-09-02 and would set the ticket back to `draft` with `completed_at: null`. This matches the enrichment rule: take the more recent side.
  - **Body**: kept incoming. It contains all of HEAD's body plus a new appended section, "Where this happens: `capture_site` finishes the job it starts", with its acceptance criteria (superset rule).
  - Staged with `git add --sparse` because the path is outside the sparse cone. No conflict markers remain.

## Incoming changes preserved

- The incoming commit's body addition (+35/-1) is fully present. The staged diff against HEAD is exactly that +35/-1 hunk on this file.
- Only the incoming side's older header values were not taken, because HEAD's are later.
- Flagged for post-merge review, as the enrichment rule requires (intent unknown on both sides).

Out of scope and left as they were: unstaged `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, and untracked `.xgd/tickets/hot/report-bcb10db4.md`.
