---
uid: report-6a40b13f
id: REPORT-10907
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-04T18:55:18.601679+00:00'
updated_at: '2026-11-04T18:55:18.601679+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-3f77b790
  parent_report_uid: report-06a422ea
  batch_index: '0'
---

Batch 0 is fixed. The batch's 8 test files, run together with the REQ-191, REQ-193 and REQ-194 suites they depend on, give 15 files and 136 tests, all passing. I changed no production code, added no skip markers and renamed no tests. The typecheck doesn't cover `tests/` (there's no root `tsconfig.json`), so these files are only checked when vitest runs them.

The planner was right: all 33 failures were tests still written against the old schema, and the code matched the new intents.

**What I changed in the tests:**
- **Finding a person by address:** the hosting-flag UPDATEs and membership lookups now go through `user_emails` (`USER_ID_BY_EMAIL_SQL` / `personByEmail`) instead of the removed `users.email`.
- **Accepting terms:** `findAccount` now returns an account rather than a person, so the operator setups accept terms with the person's id, not the account's.
- **Grants and second businesses:** `openGrant` and `provisionBusiness` are called with the account key; `provisionBusiness` no longer takes an address.
- **Seeding contacts:** the uninvited contact is seeded through `tests/support/contact.ts`, not a raw `INSERT` carrying an address.
- **Reading rows back:**
  - The editing suite's row reader joins the primary address and current name, using the same SQL fragments the product uses.
  - AC2192 now reads the nested `name` record, and checks that saving only the known-as part leaves the displayed name alone.
- **Businesses payload:** read as `person` (AC2157 now also asserts `person.email`). The portal node tests send `person`, and one new case checks that a payload carrying only the old `account` key leaves the line hidden.
- **AC2153:** the starter site's slug is `unnamed`, not the business id, and it is the business's only site row.
- **Contacts panel node tests:**
  - The person fixtures use the name record.
  - AC2179 adds a person whose name was redacted to empty, who shows "No name yet".
  - AC2188 checks the nine fields under "Who they are" only (just Email editable), and checks that the seven name parts sit in "Their name" and are editable.
- **AC2219:** the footprint is now read by key and includes the person's `user_emails` rows and their `accounts` row. It also confirms both businesses are owned by that account.

**ACs I reworded with `xgd ticket update`:**
- **AC-2153:** the starter slug is `unnamed`, not the business id.
- **AC-2154:** the first business is provisioned for the person's account, with no address.
- **AC-2222:** the account line comes from `person`.
- **AC-2219:** the footprint includes addresses and the account row.

**Left alone because they're outside this batch:** in the same files, AC2217 still uses an `acct_` id for a business that doesn't exist, and the AC2189 and AC2223 fixtures still use the old `displayName` and `account` shapes. Those tests pass as they are.

```yaml
## Assessment
blocked_by: null
```