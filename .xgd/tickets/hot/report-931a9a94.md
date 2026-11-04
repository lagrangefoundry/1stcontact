---
uid: report-931a9a94
id: REPORT-10862
type: report
title: 'Report: fix_plan for story-7b1025b8'
created_by: xgd
created_at: '2026-11-04T16:42:31.704084+00:00'
updated_at: '2026-11-04T16:42:31.704084+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-7b1025b8
  fix_iteration: 4
  items:
  - index: 0
    tests:
    - the invite is a transition, not a creation test_UAT_AC2169_inviting_a_known_contact_promotes_that_row_and_reports_created
    - the invite is a transition, not a creation test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column
    - the invite is a transition, not a creation test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_overwrites_a_name
    - the invite is a transition, not a creation test_UAT_AC1743_re_inviting_a_known_address_reports_the_person_and_creates_nothing
    - the invite is a transition, not a creation test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login
    - who may invite test_UAT_AC2172_only_an_owner_may_invite_and_every_refusal_writes_nothing
    - who may invite test_UAT_AC2174_the_people_list_reports_canInvite_and_canFulfil_separately
    - the invite writes no membership and no grant test_UAT_AC2173_the_invite_writes_no_membership_or_grant_and_the_invitee_is_refused_no_membership
    - the invite writes no membership and no grant test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject
    - provisioning a business test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site
    - invite plus provisioning makes a customer test_UAT_AC2176_invite_provision_sign_in_reaches_only_that_business_and_its_account
    - login binds, and provisions nothing test_UAT_AC1748_an_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account
    - login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_excludes_its_business_and_refuses_only_when_none_remain
    - admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant
    - admission returns the set of businesses test_UAT_AC2077_a_withdrawn_or_expired_membership_is_absent_from_the_list
    - membership admits; entitlement does not test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides
    - membership admits; entitlement does not test_UAT_AC2076_a_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason
    - membership admits; entitlement does not test_UAT_AC1751_a_future_start_makes_its_business_unselectable_not_the_person_refused
    - membership admits; entitlement does not test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates
    - a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing
    - a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on
    - a lapse explains itself test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted
    dependency_tests:
    - test_UAT_AC1741_
    - test_UAT_AC1745_
    - test_UAT_AC1746_
    - test_UAT_AC1747_
    - test_UAT_AC1749_
    - test_UAT_AC1754_
    - test_UAT_AC1755_
    - test_UAT_AC1756_
    - test_UAT_AC1757_
    - test_UAT_AC1758_
    - test_UAT_AC1759_
    - test_UAT_AC1760_
    - test_UAT_AC2175_
    hypothesis: 'tests/reconciliation-identity-invite-provision-admission.workers.test.ts
      still uses the person model from before REQ-191, REQ-193 and REQ-194: provisionBusiness({accountUserId,
      email}), users.email, users.display_name, users rows with no account_id, and
      findAccount read as a person. Every setup step therefore throws before it asserts
      its AC.'
    instructions: 'Production code is right and stays untouched (reconcile; rung 1:
      REQ-191, REQ-193 and REQ-194 supersede the REQ-186 vocabulary this file was
      written in). Bring this one test file onto the current model by reusing the
      fixtures that already follow it, not by writing new local copies. (1) Every
      provisionBusiness call (lines 433, 528, 569, 616, 645, 660, 663, 799, 800, 875,
      888, 911, 912, 962, 989, 1017, 1038, 1050, 1087, 1126) passes { accountId: <that
      person''s users.account_id>, name, ... } with no email, as tests/support/invite-account.ts
      does. Line 660 becomes accountId ''  '' and expects ''A business needs an account
      to belong to.'' (identity.ts:673). (2) Replace the local addContact with seedContact
      from tests/support/contact.ts. users has no email column, and account_id is
      NOT NULL. (3) rowsFor must resolve people through user_emails (join PRIMARY_EMAIL_SQL
      as invite-account.ts does). It must still prove exactly one person per address.
      (4) AC2171 reads the name through apps/control-app/src/names.ts (currentNameOf),
      not users.display_name. (5) anOperator: findAccount now returns an AccountRow
      (identity.ts:1114-1128). Resolve the operator''s PERSON by address, call acceptTerms
      with that person''s id, and read platform_operator from that person''s users
      row. This is why AC2170, AC1744, AC2172, AC2173 and AC2174 fail even though
      they do not call provisionBusiness directly. (6) In AC2170''s shape(), exclude
      account_id as a per-person identifier. Wherever the grant() helper passes accountId
      (AC2115, AC2116), use an accounts.id. Do not weaken any observation. Re-read
      each AC body; if one names a person where REQ-194 now says account, correct
      it in place with a note citing REQ-194. The 13 dependency tests live in the
      same file and must stay green after the helper rewrite.'
    test_scope: test_UAT_AC2169_ or test_UAT_AC2170_ or test_UAT_AC2171_ or test_UAT_AC1743_
      or test_UAT_AC1744_ or test_UAT_AC2172_ or test_UAT_AC2174_ or test_UAT_AC2173_
      or test_UAT_AC2115_ or test_UAT_AC1742_ or test_UAT_AC2176_ or test_UAT_AC1748_
      or test_UAT_AC1753_ or test_UAT_AC2075_ or test_UAT_AC2077_ or test_UAT_AC2112_
      or test_UAT_AC2076_ or test_UAT_AC1751_ or test_UAT_AC1752_ or test_UAT_AC2113_
      or test_UAT_AC2114_ or test_UAT_AC2116_ or test_UAT_AC1741_ or test_UAT_AC1745_
      or test_UAT_AC1746_ or test_UAT_AC1747_ or test_UAT_AC1749_ or test_UAT_AC1754_
      or test_UAT_AC1755_ or test_UAT_AC1756_ or test_UAT_AC1757_ or test_UAT_AC1758_
      or test_UAT_AC1759_ or test_UAT_AC1760_ or test_UAT_AC2175_
    ladder:
      rung1: 'Decided here: REQ-191 (addresses in user_emails), REQ-193 (names module)
        and REQ-194 (accounts own businesses; provisionBusiness takes accountId; findAccount
        returns an account) are later in scope than REQ-186, whose vocabulary the
        test file uses, so the tests change.'
      rung2: 'It agrees: reconcile-src-BUNDLE-37 identity.ts:793-798 (provisionBusiness
        accountId, with the refusal), identity.ts:1391 (findAccount returns AccountRow),
        and 0001_baseline.sql:437 (users.account_id NOT NULL) and :479 (user_emails).'
      rung3: Not reached; the code stands and the tests are rewritten to the current
        model.
---

# Fix Plan — Iteration 4

## Hypothesis
`tests/reconciliation-identity-invite-provision-admission.workers.test.ts` still writes and reads the person model from before REQ-191, REQ-193 and REQ-194. The production code, `tests/support/invite-account.ts` and `tests/support/contact.ts` have all moved on, so every setup step fails before the test asserts its AC. The file's stale shapes:
- `provisionBusiness({accountUserId, email})`
- `INSERT INTO users (… email …)` with no `account_id`
- `SELECT * FROM users WHERE email = ?`
- `users.display_name`
- `findAccount(...)` read as a person row (`.platform_operator`, `.id` passed to `acceptTerms`)

## Analysis
**Every failing test is in one file:** `tests/reconciliation-identity-invite-provision-admission.workers.test.ts`. The 20 "orphan AC" entries are the same 20 ACs whose only test is one of the 22 failures. They clear when those tests go green. They are not a separate matrix problem.

**The failure details are unusable.** The quality report's JUnit XML is missing and its streamed stdout is truncated. The workers pool also cannot be run in the planner sandbox (`listen EPERM 127.0.0.1`). The 7 messages that did survive are all one error:
`Error: A business needs an account to belong to. at provisionBusiness (apps/control-app/src/identity.ts:673)`
They are thrown from test lines 962, 989, 1017, 1038, 1050, 1087 and 1126, where the call passes `{ accountUserId, email }`.

**Six drift points, all in the test file:**
1. **`provisionBusiness` spec (REQ-194, REQ-191).**
   - `BusinessSpec` is now `{ accountId, name, plan?, startsAt?, endsAt?, grantedBy?, note? }`. `accountId` is an `accounts.id`, not a person id, and there is no `email` (`identity.ts:598-629`).
   - The call refuses a blank account (`:673`), an unknown account (`:682`) and an account with no people (`:690`).
   - Every call site passes `accountUserId` and `email`: lines 433, 528, 569, 616, 645, 660, 663, 799, 800, 875, 888, 911, 912, 962, 989, 1017, 1038, 1050, 1087 and 1126.
   - The person's account is `users.account_id`. `tests/support/invite-account.ts` already does this (`accountId: user.account_id`).
   - The blank-owner refusal at line 660 must now use `accountId: '  '`. Its expected message is `A business needs an account to belong to.`
2. **Contacts are four rows (REQ-191, REQ-193, REQ-194).**
   - `addContact` (line 159) inserts `users(…, email, …)`. That column no longer exists, and `users.account_id` is now `NOT NULL` (`db/migrations/0001_baseline.sql:424`).
   - The registered fixture is `seedContact` in `tests/support/contact.ts`. Use it instead of a local copy.
3. **Addresses live in `user_emails` (REQ-191).**
   - `rowsFor` (line 181) filters `users` by `email`. It should resolve through `user_emails`, joining with `PRIMARY_EMAIL_SQL` the way `invite-account.ts` does.
   - "One row per address" is still a valid observation. It must be counted on `users` joined through `user_emails`, so the test still proves that no second person was inserted.
4. **Names live in the names module (REQ-193).** AC2171 asserts `row.display_name`, which is not a `users` column. Read the current name through `apps/control-app/src/names.ts` (`currentNameOf`), as well as from the invite response's `person.displayName`.
5. **`findAccount` returns an `AccountRow` (REQ-194, `identity.ts:1114-1128`).**
   - `anOperator` (line 150) reads `account.platform_operator`, which is undefined on an account row. It also calls `acceptTerms(…, account.id)`, which is now an `acct_…` id, not the person's.
   - As a result the operator never accepts terms and the capability check reads `undefined`.
   - Affected tests: AC2170, AC1744, AC2172, AC2174 and AC2173.
   - The fixture must resolve the operator's person (by address, through `user_emails`) and use that person's id and `platform_operator`.
6. **Identifier columns and grant subjects.**
   - AC2170's `shape()` comparison excludes identifiers. `account_id` is now a per-person identifier and must be excluded as well.
   - The `grant()` helper's `accountId`, used by AC2115 and AC2116 for subject grants, must be an `accounts.id`, because `entitlements.account_id` now names an account.

**Reference state agrees with the current code.** At `reconcile-src-BUNDLE-37`:
- `identity.ts:793-798`: `provisionBusiness` with `accountId` and the same refusal.
- `identity.ts:1391`: `findAccount` returns `AccountRow`.
- `db/migrations/0001_baseline.sql:437`: `users.account_id TEXT NOT NULL`.
- `db/migrations/0001_baseline.sql:479`: `user_emails`.

**No production change is needed.** The mode is reconcile and code is authoritative. This is the same kind of drift as iterations 1–3: a test written to an older intent, broken by a later in-scope intent. But it is a different surface and a different set of intents (REQ-191, REQ-193, REQ-194 against REQ-168/184/186 before). The hypothesis is new, not a repeat.

**Isolation.** These are deterministic setup errors (a thrown refusal, and SQL against missing columns). There is no contamination pattern, and no isolation analysis is needed.

## Spec Changes Made
None. The AC wording still holds under REQ-194:
- AC-2115: "optionally an account as subject". An account is now an `accounts.id`, which strengthens the wording.
- AC-2176: "reaches only that business and its account".

Only the test vocabulary drifted. If the builder finds an AC that names a person where REQ-194 says account, it should be corrected in place with a note citing REQ-194.

## Weak Evidence Flags (preventative — best effort)
- `the invite is a transition, not a creation test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column` — weak-observation — `expect(Object.keys(shape(aliceRow)).length).toBeGreaterThan(2)` is a `len > N` floor. Name the compared columns explicitly (status, pipeline_stage, platform_operator, tos_*), so a schema change that drops one is noticed.
- `the invite is a transition, not a creation test_UAT_AC2169_inviting_a_known_contact_promotes_that_row_and_reports_created` — infra-reuse-gap — the local `addContact` reinvents `tests/support/contact.ts#seedContact`. Delete the local helper rather than patch it.
- `provisioning a business test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site` — weak-observation — while editing, assert `tenants.owner_account_id` equals the person's `users.account_id`. That is the one fact REQ-194 added to provisioning, and nothing in this file observes it.

## Batches
**One batch.** All 22 failures, plus the 17 passing tests in the same file, share one file and the same three helpers (`anOperator`, `addContact`, `rowsFor`). Splitting would put the helper rewrite in two batches. No production files are in the edit path.

## Resolution ladder (REQ-938)
**Batch 0 is decided at rung 1.**
- REQ-191 moved addresses to `user_emails`.
- REQ-193 moved names to the names module.
- REQ-194 introduced `accounts`, made `provisionBusiness` take `accountId`, and made `findAccount` return an account.

All three are later in scope than REQ-186, whose vocabulary the test file uses, and they supersede it on this surface. Rung 2 agrees: `reconcile-src-BUNDLE-37` shows `identity.ts:793-798`, `identity.ts:1391` and `db/migrations/0001_baseline.sql:437,479`. The tests change; the code stands.
