---
uid: report-0faeb796
id: REPORT-7549
type: report
title: 'Report: fix_plan for story-7b1025b8'
created_by: xgd
created_at: '2026-11-01T10:07:35.708346+00:00'
updated_at: '2026-11-01T10:07:35.708346+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-7b1025b8
  items:
  - index: 0
    tests:
    - the invite provisions test_UAT_AC1740_an_invite_creates_person_account_membership_and_grant
    - the invite provisions test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate
    - the invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide
    - login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant
    - login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included
    - login binds, and provisions nothing test_UAT_AC1750_a_grant_end_is_evaluated_from_both_sides
    - login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit
    - login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_refuses_whatever_its_dates_say
    - login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone
    - login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest
    - login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account
    - the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable
    - the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason
    - the request path test_UAT_AC1760_an_invited_and_entitled_person_reaches_the_builder
    - the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back
    - the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape
    - admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account
    - admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant
    - admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted
    - admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list
    - grant state is evaluated per business test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed
    - grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused
    - grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates
    - membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain
    dependency_tests:
    - test_UAT_AC1743_
    - test_UAT_AC1744_
    - test_UAT_AC1745_
    - test_UAT_AC1746_
    - test_UAT_AC1747_
    - test_UAT_AC1755_
    - test_UAT_AC1757_
    - test_UAT_AC2079_
    - test_UAT_AC2112_
    - test_UAT_AC2113_
    - test_UAT_AC2114_
    - test_UAT_AC2115_
    - test_UAT_AC2116_
    hypothesis: tests/reconciliation-identity-invite-and-admission.workers.test.ts
      and tests/reconciliation-identity-multi-business-admission.workers.test.ts read
      result.accountId / b.accountId and query memberships.account_id / entitlements.account_id,
      but identity.ts returns businessId and migration 0006 renamed those columns
      to business_id, so every bound identifier is undefined.
    instructions: 'The evidence for STORY-146 is broken by vocabulary drift in the
      TESTS, not by the code. identity.ts (HEAD lines 181, 330, 362, 423-443, 512)
      returns `businessId` from provisionInvite/provisionBusiness and on each AdmittedBusiness.
      The HEAD schema (db/migrations/0006_entitlement_subject.sql lines 33, 46, 71)
      renamed memberships.account_id and entitlements.account_id to business_id and
      re-added entitlements.account_id as the nullable SUBJECT account; the reference
      writes the same columns (identity.ts lines 849, 860). In both test files, bring
      every reference into line with that: result/b `.accountId` -> `.businessId`;
      `memberships.account_id` and the business-keyed `entitlements.account_id` in
      SELECT/UPDATE/INSERT/DELETE -> `business_id`; `entitlement?.account_id` assertions
      that mean ''the grant belongs to this business'' -> `entitlement?.business_id`.
      Keep the `Object.keys(first)).not.toContain(''accountId'')` style assertions
      (no singular top-level id on Admission) and make them also reject `businessId`/`entitlement`
      at the top level. Then re-run. Where an older-file test (invite-and-admission)
      asserts single-business semantics that contradict the REQ-178 per-business test
      for the same AC in the multi-business file (lapsed/revoked/future/inactive business
      is listed unselectable, and the person is refused only when no business qualifies),
      the multi-business shape is the intent. Either make the older test agree or
      retire it as a duplicate, provided the AC still has a passing test. If the older
      AC1760 test still fails after the rename because it predates the terms-acceptance
      gate, retire it in favour of the passing terms-aware AC1760 test. While in these
      files, re-key the AC1746 test''s raw entitlement inserts to business_id so it
      exercises the business-scoped grant model. Production code is frozen and needs
      no change; every test must end green against the real D1 schema. Note: the terms-aware
      AC1760 test (`..._who_accepted_the_current_terms_reaches_the_builder`) passes
      now and must stay green; it is selected by the test_UAT_AC1760_ token.'
    ladder:
      rung1: 'REQ-168 and REQ-184 (later than STORY-146''s original wording) rename
        the business identifier to businessId and the membership/entitlement columns
        to business_id; REQ-178 (later) makes grant/membership state per-business.
        This decides: the tests change.'
      rung2: 'The reference agrees: reconcile-src-BUNDLE-35:apps/control-app/src/identity.ts
        line 341 (AdmittedBusiness.businessId), line 755 (BusinessResult.businessId),
        and lines 849/860 (INSERTs into memberships.business_id and entitlements.business_id);
        line 246 documents that business_id is the object and the old account_id column
        was split.'
      rung3: Not reached; the test assertions about behaviour stand, only their identifier/column
        vocabulary is rewritten.
    test_scope: test_UAT_AC1740_ or test_UAT_AC1741_ or test_UAT_AC1742_ or test_UAT_AC1743_
      or test_UAT_AC1744_ or test_UAT_AC1745_ or test_UAT_AC1746_ or test_UAT_AC1747_
      or test_UAT_AC1748_ or test_UAT_AC1749_ or test_UAT_AC1750_ or test_UAT_AC1751_
      or test_UAT_AC1752_ or test_UAT_AC1753_ or test_UAT_AC1754_ or test_UAT_AC1755_
      or test_UAT_AC1756_ or test_UAT_AC1757_ or test_UAT_AC1758_ or test_UAT_AC1759_
      or test_UAT_AC1760_ or test_UAT_AC2075_ or test_UAT_AC2076_ or test_UAT_AC2077_
      or test_UAT_AC2078_ or test_UAT_AC2079_ or test_UAT_AC2112_ or test_UAT_AC2113_
      or test_UAT_AC2114_ or test_UAT_AC2115_ or test_UAT_AC2116_
  fix_iteration: 1
---

# Fix Plan — Iteration 1

## Hypothesis
Both STORY-146 test files still use the pre-REQ-168/REQ-184 vocabulary. They read `result.accountId` / `b.accountId`, which is now `businessId`, and they query `memberships.account_id` / `entitlements.account_id`, which migration 0006 renamed to `business_id` (`entitlements.account_id` now means the grant's *subject* account). So every identifier the tests bind is `undefined` (D1_TYPE_ERROR), and every lookup by business returns nothing.

## Analysis
- **Failing files:** `tests/reconciliation-identity-invite-and-admission.workers.test.ts` (older, single-business wording) and `tests/reconciliation-identity-multi-business-admission.workers.test.ts` (REQ-178, multi-business wording).
- **Error signatures** (from the report stdout):
  - `D1_TYPE_ERROR: Type 'undefined' not supported` at `.bind(result.accountId)`, in `setGrant` (line 54), `shapeOf` (line 150) and lines 97, 262, 349 and 458.
  - `expected 1 to be 2` at line 300: `byId` keys the map by `b.accountId`, so both businesses collapse onto the `undefined` key.
  - `expected null to be undefined` at line 377.
- **The code agrees with the reference state.**
  - HEAD `apps/control-app/src/identity.ts`:
    - lines 181 and 330: `businessId`.
    - lines 423–443: `provisionInvite` returns `{created, user, businessId, siteSlug}`.
    - line 512: `provisionBusiness` returns `{businessId, name, siteSlug}`.
    - line 487: inserts `memberships (... business_id ...)`.
  - HEAD `db/migrations/0006_entitlement_subject.sql` (not present at the reference, whose migration set differs):
    - line 33: `memberships.account_id` → `business_id`.
    - line 46: `entitlements.account_id` → `business_id`.
    - line 71: re-adds `entitlements.account_id` as the nullable subject.
  - Reference `reconcile-src-BUNDLE-35:apps/control-app/src/identity.ts`:
    - line 341: `businessId: string` on AdmittedBusiness.
    - line 755: BusinessResult.businessId.
    - lines 849 and 860: writes `memberships.business_id` and `entitlements.business_id`.
- **Mode:** reconcile. Code is authoritative and frozen, and the tests are what is wrong. No production change, no override.
- **Passing neighbours use the same helpers and must stay green:** AC1743–1747, AC1755, AC1757, AC2079, AC2112–AC2116, and the terms-aware AC1760 test.
- **Duplicate coverage.** AC1740, AC1748 and AC1750–AC1753 each have a test in BOTH files. The older file's titles assert single-business semantics ("does not admit", "refuses"). REQ-178 is the later intent: a lapsed or inactive business is listed and unselectable, and the person is refused only when none qualify. Where an older-file test contradicts the multi-business test, the multi-business shape wins, and the builder may retire the older duplicate as long as the AC stays covered.
- **AC1760 has two tests:**
  - `..._an_invited_and_entitled_person_reaches_the_builder` fails.
  - `..._an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder` passes.
  - If the failing one still fails after the rename, it is because it predates the terms-acceptance gate (`terms.ts`). It should then be retired as superseded by the terms-aware test, not "fixed" by weakening it.
- **The 12 orphan ACs** (AC1740/41/42/48/49/51/52/53/54/56/58/59) are a consequence, not a separate problem. They clear once their tests pass.
- **No isolation or contamination pattern:** this is iteration 1, and the failures are deterministic undefined binds.

## Revision note (re-filed after validator refusal)
The first filing of this plan (REPORT-7548) was refused by `test_fix_validate_plan` (`fix_plan_filter_rejected`). All 14 `dependency_tests` entries were refused because they were "describe-prefix + test name" strings, which are not exact selectors. This filing gives them as AC tokens (`test_UAT_AC<N>_`). The terms-aware AC1760 test is covered by the `test_UAT_AC1760_` token that is already in scope. The diagnosis is unchanged. It was re-verified at `reconcile-src-BUNDLE-35`: the reference has no `0006_entitlement_subject.sql` (its 0006 is `asset_grants`), so rung-2 evidence now cites only reference identity.ts lines.

## Spec Changes Made
none. The AC wording ("account's identifier", "business") is behaviour-level and agrees with the code. Only test vocabulary drifted.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-identity-invite-and-admission.workers.test.ts::test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values` — weak-observation — it inserts entitlements keyed only by `account_id` (now the subject column) with no `business_id`, so it passes without exercising the business-scoped grant model. Re-key it to `business_id`.
- `tests/reconciliation-identity-invite-and-admission.workers.test.ts` vs `tests/reconciliation-identity-multi-business-admission.workers.test.ts` — infra-reuse-gap — both define their own `identityEnv`, `ISO` and email-sequence helpers, and both prove the same ACs. Consolidate onto one file or a shared helper.
- `tests/reconciliation-identity-multi-business-admission.workers.test.ts::test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape` — inter-test-dependency — the `count()` before/after on whole tables is order-sensitive if another test writes in parallel within the same D1 instance. Scope the counts by business or owner.

## Batches
One batch. Both files share the same root cause, the same production module (`identity.ts`) and the same schema, and the two files have overlapping, possibly contradictory ACs that must be resolved together.

## Resolution ladder (REQ-938)
- **Batch 0 — decided at rung 1.** REQ-168 and REQ-184 come later in the timeline than STORY-146's original wording. They rename the business identifier to `businessId` and the columns to `business_id`. REQ-178, also later, makes grant and membership state per-business. **Rung 2 agrees:** reference identity.ts line 341, line 755, lines 849/860 (business_id writes) and line 246 (subject/object split); HEAD 0006 lines 33/46/71 match. **The tests change; the code does not.**