---
uid: report-cbebd8d6
id: REPORT-11052
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:51:31.951801+00:00'
updated_at: '2026-11-05T20:51:31.951801+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `tests/test_reconciliation_baseline_schema.test.ts` (incoming path `tests/test_UAT_FC_REQ-190_baseline.test.ts`, renamed on HEAD) — UU, code/test file class (2c). Both sides edited different parts of the same block, and the changes fit together (2c.3b, integrated by hand):
  - HEAD (reconcile bundle-5052a63c): a comment saying `ticket_change_floor` is keyed on `tenant_id`, and the expected list written one value per line.
  - Incoming (dd8f4a07ee, REQ-202): a comment on `login_tokens.id` / `sessions.id`, and two more `'id'` entries (10 → 12).
  - Result: both comments kept, HEAD's one-per-line layout, incoming's list of 12 `'id'` + `'tenant_id'` + `'uid'`. The table-list comment above it now names `login_tokens` and `sessions`, and its count reads "FOURTEEN, NOT THIRTEEN". That count matches the 14 `TEXT PRIMARY KEY` declarations in `db/migrations/0001_baseline.sql`.

## Incoming changes preserved

- Both parts of the incoming hunk are in the resolved file: the REQ-202 comment paragraph and the expected list growing to 12 `'id'` entries.
- Spot-check: `npx vitest run tests/test_reconciliation_baseline_schema.test.ts` passed 6/6.
- Staged; `git status --porcelain` shows no conflict-class entries.
- The only addition found on neither side is the corrected table count and names in the nearby comment. The DDL change both sides already carry made the old wording wrong, so this is a factual correction, not new semantics.
- Flagged for post-merge review per the enrichment rule: intent was unknown on the incoming side.
