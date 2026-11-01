---
uid: report-51bb06e8
id: REPORT-7858
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T21:36:19.842911+00:00'
updated_at: '2026-11-01T21:36:19.842911+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-54bc92a7
  parent_report_uid: report-d43d2825
  batch_index: '0'
---

All 12 tests in the two Business Fulfilment suites now pass, including the nine in this batch (AC-2149, AC-2150, AC-2152 to AC-2158). The ACs were flagged as orphaned only because their UATs couldn't run. No production code was touched.

**Why they failed:** the tests were written against code that later tickets in this bundle changed.
- **AC-2149, 2150, 2152 to 2157** (`tests/test_reconciliation_business_fulfilment.workers.test.ts`): they called `provisionInvite`, which REQ-186 deleted, and set up the operator with `platform_admin = 1`. REQ-185 renamed that column to `platform_operator`, and setting it no longer opens the add-a-business route.
- **AC-2158** (`tests/test_reconciliation_business_fulfilment_guards.test.ts`): the static guard expected the old column to be read in two files (`scope.ts` and `router.ts`). The renamed column is now read only in `scope.ts`.

**Test changes:**
- Accounts are now seeded with the `inviteAccount` fixture (invite the person, then provision their business). The operator is seeded with `ensurePlatformOperator`, the same way the `PLATFORM_ADMINS` break-glass setting does it. This matches the existing REQ-180 suite.
- **AC-2149** now also covers the second case its AC asks for: a caller with `platform_operator` set but no owner membership on the 1st Contact business gets 404, and no business is created.
- **AC-2154** now tests the two steps separately. An invited person with no business is refused at sign-in (`no_membership`). After `provisionBusiness`, they are admitted with exactly that one business.
- **AC-2158**:
  - The guard allows only one reader of the column, `scope.ts`.
  - It now asserts that `router.ts` does not read the column and calls `ownsPlatformBusiness(` instead.
  - Its five-line check that the guard can actually detect reads was updated to the new column name.

**Ticket changes**, made with `xgd ticket update`:
- **AC-2154:** title and body rewritten. They said the invite creates the first business, which stopped being true when REQ-186 removed `provisionInvite`.
- **STORY-162:** four stale passages corrected (the one-call invite in "In scope" and "Technical Context", and the old setup code-issue, which is now fixed).

**Leftovers:**
- The AC-2158 test is still named `…platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate`, which no longer describes what it checks. I kept the name because the failure report tracks the test by it.
- I couldn't run lint. There is no ESLint config in the repo, and `npx eslint` failed because the sandbox blocks the npm registry. The tests also have no tsconfig, so they aren't type-checked.

```yaml
## Assessment
status: fixed
tests_passing: "12/12 in the two Business Fulfilment suites (all 9 batch tests included)"
production_code_changed: false
tickets_updated: [AC-2154, STORY-162]
```
