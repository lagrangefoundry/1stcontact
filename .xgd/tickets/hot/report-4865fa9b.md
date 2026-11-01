---
uid: report-4865fa9b
id: REPORT-7819
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T19:39:20.125524+00:00'
updated_at: '2026-11-01T19:39:20.125524+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-a55c2f35
---

I wrote UATs for all 15 ACs of story-a55c2f35 (plan item 4 of 8). 15 pass and 3 fail. The 3 failures are the code issues already flagged in the story's Reconciliation Decisions, so the tests are right and the code is wrong. I did not change any runtime code.

```
⚠️ TESTS FAILING — downstream fix-it loop required

Story: story-a55c2f35
Test file(s) created:
  - tests/test_reconciliation_contacts_tab_editing.workers.test.ts   (server, run in workerd against real D1 — 11 tests)
  - tests/test_reconciliation_contacts_tab_editing.test.ts           (panel, run in jsdom — 7 tests)

Tests written: 18 (covering 15 ACs, AC-2188 … AC-2202)
Tests passed: 15
Tests failed: 3

Failures:
  - test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400:
      the happy path passes (source forced to admin_grant, status active, grantor recorded,
      appears in the detail); a grant with no business returns 500, not 400 with
      "A grant must name the business it is for.". InvalidGrantError is never mapped
      to 400 in router.ts.
  - test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access:
      revoking keeps the row with status revoked and revoked_at set, and the business stops
      being selectable; revoking an unknown id returns 500, not 400 "No such grant.".
      Same unmapped InvalidGrantError.
  - test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner:
      a non-owner member opens a grant and gets 200, not 403. POST /api/grants,
      /api/grants/revoke and /api/people/status have no ownsBusiness check.

test_files_created:
  - "tests/test_reconciliation_contacts_tab_editing.workers.test.ts"
  - "tests/test_reconciliation_contacts_tab_editing.test.ts"
```

There are 18 tests for 15 ACs because three ACs each describe one server behaviour and one panel behaviour. The two halves need different test runtimes (workerd and jsdom), so each of AC-2190, AC-2199 and AC-2201 has one test in each file. The sibling read-side story did the same thing for AC-2185.

For AC-2197 and AC-2200 I needed a caller who is a member of a business but not its owner. No shipped code creates that kind of membership yet, so the test inserts the membership row directly with role `editor`. Everything else is set up through shipped code (`inviteAccount`, `invitePerson`, `ensurePlatformOperator`).

**Not checked:**
- **Lint:** eslint isn't installed in this worktree, and the sandbox blocked downloading it from the npm registry.
- **Type check:** no tsconfig covers `tests/`, so tsc doesn't check these files. Vitest compiled both files without errors, but it doesn't check types.
