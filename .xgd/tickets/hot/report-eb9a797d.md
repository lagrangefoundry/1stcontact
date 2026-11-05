---
uid: report-eb9a797d
id: REPORT-10962
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T19:51:05.112195+00:00'
updated_at: '2026-11-05T19:51:05.112195+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json`: config/metadata file, UU, conflict on the `"version"` scalar only. Rule applied: the enrichment's "intent unknown, take the more recent commit by timestamp" rule. HEAD's `chore(version): 0.2.117 for REQ-198` (2026-11-04 12:50 -0800) is newer than incoming 652957a0a3 `feat(material): ingestion from a dropped file to an indexed ticket` (2026-11-01 18:07 -0800). Kept `"version": "0.2.117"`, removed the markers, staged the file. Flagged for post-merge review as the rule requires.

## Incoming changes preserved

- The incoming commit's only change to `package.json` was a version bump from 0.2.23 to 0.2.24. HEAD's later bump to 0.2.117 replaces it. Going back to 0.2.24 would be a version regression, so dropping that one-line bump is correct. No other incoming changes to `package.json` were dropped.
- The incoming change to `tests/reconciliation-builder-workspace-origin.test.ts` applied cleanly and is staged (M). The commit is therefore not empty compared with HEAD.

## Post-merge review flag

- `package.json`: check that the version should be 0.2.117 (or later) after the bundle merges.
