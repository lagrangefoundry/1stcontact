---
uid: report-2da79ae6
id: REPORT-8178
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:31:08.114932+00:00'
updated_at: '2026-11-02T01:31:08.114932+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-2e50962c.md` (REQ-191). File class: intent/bookkeeping ticket (2e). Rule: same field changed differently on each side, so take the later value per fact. Result: OURS (HEAD).
  - Incoming dea6f56751 ("update request request-2e50962c", 2026-09-06T18:28:53) changes only `status: free_coded -> ready_to_reconcile`, plus its own `updated_at`/`last_field_updated` bookkeeping.
  - HEAD has `status: bundled` (updated_at 2026-11-01T23:18:44) with `bundled_in: bundle-5052a63c`, which is the bundle this reconcile run is processing. `bundled` comes after `ready_to_reconcile` in the request lifecycle and is about two months more recent, so HEAD's value supersedes the incoming status rather than competing with it. Applying the incoming value would move the ticket back out of the bundle being reconciled.
  - Ours was taken with `git checkout --ours` and staged with `git add --sparse`. The file is outside the sparse cone, so the conflict existed only in the index.

## Incoming changes preserved

No code files were involved. The incoming commit's only substantive change, the status advance past free_coded, is already superseded in HEAD by the later `bundled` status, so the commit is redundant rather than discarded. The staged result has no diff against HEAD, and the finalize step will detect that and skip the commit.
