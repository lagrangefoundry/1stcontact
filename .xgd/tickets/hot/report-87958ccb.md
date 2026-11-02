---
uid: report-87958ccb
id: REPORT-8198
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:38:37.459997+00:00'
updated_at: '2026-11-02T01:38:37.459997+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `tests/test_UAT_FC_REQ-190_baseline.test.ts`: a UAT test file in `tests/**`. Rule 2c.3b applied (both sides made independent, useful changes to the same region, so I combined them by hand). HEAD (the free-REQ-191 merge) added `ticket_change_floor` (`tenant_id TEXT PRIMARY KEY`) to the single-column-key assertion. The incoming commit d1b3fa897b (REQ-194) added `accounts` (`id TEXT PRIMARY KEY`). The resolved assertion expects 8× `id`, `tenant_id`, `uid`, which matches the 10 single-column TEXT keys declared in `db/migrations/0001_baseline.sql`. I kept both explanatory comment paragraphs, added `accounts` to the table list, and changed the count to "TEN, NOT NINE". No test functions were added or removed.

## Incoming changes preserved

- The incoming comment ("`accounts` is [[REQ-194]]'s, and the same restatement...") is present verbatim.
- The incoming extra `'id'` in the expected array is present (8 ids).
- The HEAD-side `ticket_change_floor` comment and the `'tenant_id'` entry are also kept.
- Spot-check: `vitest run tests/test_UAT_FC_REQ-190_baseline.test.ts` gave 6/6 passing.
