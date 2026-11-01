---
uid: report-f35ecc8d
id: REPORT-7783
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:12:08.906585+00:00'
updated_at: '2026-11-01T16:12:08.906585+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` — intent/bookkeeping ticket (2e), index-only conflict (outside sparse cone). Rule: strict superset / later fact. HEAD (ours) carries the 2026-11-01 bundling update (status: bundled, bundled_in: bundle-39edf66d, commits list, version 0.2.74); incoming carries only the older 2026-09-05 draft-state metadata. Body content identical apart from a trailing newline. Took `--ours`.
- `.xgd/tickets/hot/request-7af3f4e4.md` — intent/bookkeeping ticket (2e), index-only conflict. Same shape: HEAD has the later 2026-11-01 status=bundled + bundled_in: bundle-39edf66d; incoming has the older 2026-09-05 status=free_coded metadata. No body differences. Took `--ours`.

Flagged for post-merge review per enrichment rule (intent unknown on one side); resolution follows the more recent timestamp, which is HEAD's side.

## Incoming changes preserved

No code files were in conflict. All incoming code/test changes (apps/control-app/src/*, package.json, tests/support/*, UAT tests REQ-167..186) were auto-merged and remain staged unchanged. The incoming side of both ticket conflicts held only stale earlier metadata, which the later HEAD state already supersedes, so nothing meaningful from the incoming commit was dropped.
