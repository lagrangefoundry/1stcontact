---
uid: report-b217c408
id: REPORT-8168
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:28:01.026439+00:00'
updated_at: '2026-11-02T01:28:01.026439+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `tests/test_UAT_FC_REQ-190_baseline.test.ts`: UAT test file, UU. Rule 2c/2f: the two sides made independent, compatible changes to the same assertion, so I combined them by hand.
  - HEAD (free-REQ-190) added `ticket_change_floor`, keyed on `tenant_id`, to the expected list of single-column TEXT primary keys.
  - Incoming (free-REQ-191, 5df406b0f8) added `user_emails`, keyed on `id`.
  - The resolved assertion is `['id' x7, 'tenant_id', 'uid']`. That matches the staged `db/migrations/0001_baseline.sql`: tenants x2, sites, users, user_emails, memberships and entitlements give seven `id`s, plus `ticket_change_floor.tenant_id` and `tickets.uid`.
  - I kept both sides' explanatory comments. The shared comment's table list now names both `user_emails` and `ticket_change_floor`, and its count changes from "EIGHT, NOT SEVEN" to "NINE, NOT EIGHT". That is just the arithmetic of combining both sides; I added no new meaning.
  - Spot-check: `npx vitest run tests/test_UAT_FC_REQ-190_baseline.test.ts` passed all 6 tests.

## Incoming changes preserved

- All the incoming hunks are in the resolved file:
  - `user_emails` is added to the table list.
  - The "`user_emails` IS THE ONE REQ-191 ADDED" comment block is kept.
  - The seventh `'id'` is in the expected array.
- I did not drop any hunk under BUG-1301.
