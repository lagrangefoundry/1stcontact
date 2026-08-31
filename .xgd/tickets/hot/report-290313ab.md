---
uid: report-290313ab
id: REPORT-2769
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:47:47.965681+00:00'
updated_at: '2026-08-31T06:47:47.965681+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-65fa5199.md` — class **AA** (both added); intent/bookkeeping ticket (REQ-47). Rules **2b** (both added, one side a strict superset → keep the superset) and **2e** (intent ticket: incoming only appended a field the HEAD side never touched → keep the superset). Resolved via `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

Sole difference between the two sides:

```
   version: 0.0.48
   bundled_in: bundle-df065afc
+  chat_comment: comment-d2af3cca
```

Every other byte of the two blobs is identical (ours `d34b4aa`, theirs `c5897c1`). No fact is changed differently on the two sides, so no timeline adjudication was needed — this is a pure single-field append by the incoming `free_coded` commit, and taking it loses nothing from the HEAD (`sync_working_to_main`) side.

The enrichment metadata flagged this file for post-merge review because HEAD's intent is `sync_working_to_main` and the incoming intent was unlabelled. Recording that here for completeness, but the one-line delta makes the resolution unambiguous: superset, not a competing edit.

## Incoming changes preserved

- `.xgd/tickets/hot/request-65fa5199.md` — incoming commit `a33524ae516ad715cd3ee4b66f2ae151e8fd4443` ("xgd(ticket): update request request-65fa5199"). Its only change relative to the HEAD-side file is the `fields.chat_comment: comment-d2af3cca` line, which is present in the resolved, staged version. `git diff --cached --stat` reports exactly `1 file changed, 1 insertion(+)`, matching that single line.

No hunks were dropped. No BUG-1301 precedence exception was invoked. No code or UAT test files were involved in this conflict.
