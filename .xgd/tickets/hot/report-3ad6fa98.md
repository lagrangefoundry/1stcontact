---
uid: report-3ad6fa98
id: REPORT-10865
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-04T16:59:45.091801+00:00'
updated_at: '2026-11-04T16:59:45.091801+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-7b1025b8
  parent_report_uid: report-b2195256
  batch_index: '0'
---

All 22 failing UATs now pass, and so do the 13 dependency UATs in the same file and AC2175 in the invite-control file: 35/35. I changed no production code. The only code change is in `tests/reconciliation-identity-invite-provision-admission.workers.test.ts`; I also edited two AC tickets, described below. Nothing is committed yet. I couldn't run a separate type check because there's no tsconfig covering the tests, and there's no lint script.

**Why they failed:** the test file was written before three newer changes. A person's email address moved off the `users` row into its own `user_emails` table (REQ-191). Names moved into `user_names` (REQ-193). And a business is now provisioned for an account, by `accountId`, rather than for a person (REQ-194).

**Test fixes:**
- **Provisioning calls:** every `provisionBusiness` call now passes `{ accountId, name }`, with no email. The account comes from the invite response's `person.accountId`, or `user.account_id` from `inviteAccount`. The empty-account case passes `'  '` and expects the exact message `'A business needs an account to belong to.'`.
- **Contacts:** the local `addContact` is gone; the test uses the shared `seedContact` fixture instead.
- **Looking people up by address:** `rowsFor` now finds people through `user_emails`. It still proves an address reaches exactly one person, and returns the primary address the same way the product does.
- **Operator setup:** `anOperator` now looks up the operator person by address, accepts terms for that person's id, and reads `platform_operator` from their row. It used to pass the account id, so the terms were never accepted and every invite came back 403. That one bug broke AC2170, AC1744, AC2172, AC2173, AC2174 and AC2176.
- **AC2171 (names):** the name is now read with `currentNameOf`. I added a check on the name history: after the third invite there is still exactly one name row, not superseded, as the AC requires.
- **AC2170:** `account_id` is now left out of the row-shape comparison, because each invite creates a new account per person.
- **AC2115 and AC2116:** grants that name an account now use real account ids.
- **AC1742:**
  - The starter page is read by joining through `sites`, since page rows no longer carry the business and slug.
  - It also asserts the business records the owning account.
  - The "two starter sites can't clash" check has changed. Both sites are now called `unnamed`, so it asserts they share that name but have different site keys, because the site's key is now its public address.

**Removed observation:** AC2115 used to check that grants seeded before a schema change were still readable afterwards. The old migrations have been replaced by a single baseline that seeds no grant or membership, so there is nothing left to check. I deleted that part of the test and the matching clause in the AC.

**AC tickets updated:**
- **AC-2115:** removed the pre-existing-grants clause, with a note citing REQ-190. It now says the subject is an account key.
- **AC-1742:** the starter site's address is its site key, not a name reserved across the whole platform, which REQ-190 removed. Provisioning is described by account key, and the business is owned by that account.

I didn't add tests or links for the 20 orphaned-AC entries. Each belongs to one of the 22 tests above and should clear now that it passes.

```yaml
## Assessment
blocked_by: null
```