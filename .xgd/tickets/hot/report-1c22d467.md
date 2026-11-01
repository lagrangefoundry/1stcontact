---
uid: report-1c22d467
id: REPORT-7804
type: report
title: 'Report: fix_plan for story-7b1025b8'
created_by: xgd
created_at: '2026-11-01T18:45:31.122841+00:00'
updated_at: '2026-11-01T18:45:31.122841+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-7b1025b8
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - membership admits; entitlement does not test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides
    - membership admits; entitlement does not test_UAT_AC2076_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason
    - a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing
    - a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on
    - an entitlement has a subject and an object test_UAT_AC2115_grant_names_its_business_as_object_and_optionally_an_account_as_subject
    - an entitlement has a subject and an object test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted
    - the request path test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder
    - the invite provisions test_UAT_AC1740_an_invite_creates_person_account_membership_and_grant
    - the invite provisions test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate
    - the invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide
    - the invite provisions test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates
    - the invite provisions test_UAT_AC1744_case_and_padding_do_not_make_a_second_person
    - the invite provisions test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing
    - login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant
    - login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included
    - login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit_its_business
    - login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates_say
    - login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone
    - login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest
    - login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account
    - the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable
    - the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason
    - the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back
    - the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape
    - the invite provisions test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one
    - admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account
    - admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant
    - admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted
    - admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list
    - grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused
    - grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates
    - membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain
    dependency_tests:
    - test_UAT_AC1746_
    - test_UAT_AC1747_
    - test_UAT_AC1755_
    - test_UAT_AC1757_
    - test_UAT_AC2169_
    - test_UAT_AC2170_
    - test_UAT_AC2171_
    - test_UAT_AC2172_
    - test_UAT_AC2173_
    - test_UAT_AC2174_
    - test_UAT_AC2175_
    - test_UAT_AC2176_
    hypothesis: REQ-186 deleted provisionInvite from apps/control-app/src/identity.ts,
      and three stale test files (reconciliation-identity-invite-and-admission, -multi-business-admission,
      -business-lapse) still import it, so every test throws TypeError before asserting;
      their active ACs are already covered by tests/reconciliation-identity-invite-provision-admission.workers.test.ts
      on the inviteAccount fixture.
    instructions: 'Every failure is TypeError: provisionInvite is not a function,
      because REQ-186 deleted that export (identity.ts header lines 19-28). Production
      code is correct and stays untouched. The evidence gap is three stale files that
      duplicate tests/reconciliation-identity-invite-provision-admission.workers.test.ts,
      which already proves AC1741-1749, AC1751-1760, AC2075-2077, AC2112-2116 and
      AC2169-2176 through tests/support/invite-account.ts (inviteAccount = invitePerson
      into the platform tenant + provisionBusiness). Several old tests share their
      exact describe and test name with the new file, so the failing copies shadow
      the passing ones in reporting. Resolve the stale files against the new file,
      AC by AC. (1) Delete the tests of superseded ACs AC-1740 (both copies), AC-2078
      and AC-2079, with no replacement. (2) Delete each old test whose AC the new
      file already proves, after checking that the new test asserts at least as much
      under the current AC wording. AC-1743 and AC-1745 were rewritten: the invite
      writes no business or grant, and the unconfigured-tenant refusal belongs to
      admit, not the invite. (3) Move any assertion only the old test makes, and that
      the current AC still requires, into the new file on inviteAccount or invitePerson+provisionBusiness.
      (4) Delete any file left with nothing unique. End state: each active AC has
      exactly one uniquely named UAT, no test in scope imports provisionInvite, and
      the whole scope is green on real code.'
    test_scope: test_UAT_AC1740_ or test_UAT_AC1741_ or test_UAT_AC1742_ or test_UAT_AC1743_
      or test_UAT_AC1744_ or test_UAT_AC1745_ or test_UAT_AC1746_ or test_UAT_AC1747_
      or test_UAT_AC1748_ or test_UAT_AC1749_ or test_UAT_AC1751_ or test_UAT_AC1752_
      or test_UAT_AC1753_ or test_UAT_AC1754_ or test_UAT_AC1755_ or test_UAT_AC1756_
      or test_UAT_AC1757_ or test_UAT_AC1758_ or test_UAT_AC1759_ or test_UAT_AC1760_
      or test_UAT_AC2075_ or test_UAT_AC2076_ or test_UAT_AC2077_ or test_UAT_AC2078_
      or test_UAT_AC2079_ or test_UAT_AC2112_ or test_UAT_AC2113_ or test_UAT_AC2114_
      or test_UAT_AC2115_ or test_UAT_AC2116_ or test_UAT_AC2169_ or test_UAT_AC2170_
      or test_UAT_AC2171_ or test_UAT_AC2172_ or test_UAT_AC2173_ or test_UAT_AC2174_
      or test_UAT_AC2175_ or test_UAT_AC2176_
    ladder:
      rung1: 'Decided here: REQ-186, in scope and later than the REQ-167/REQ-178 intents
        these tests encode, deletes the one-call invite in favour of invitePerson
        + provisionBusiness, and the story ACs (AC-1740/2078/2079 superseded; AC-1742/1743/1745/2115/2173
        rewritten) already follow it, so the stale tests change.'
      rung2: 'Agrees: reconcile-src-BUNDLE-36:apps/control-app/src/identity.ts has
        no provisionInvite export (mentioned only in the comment at line 34); provisionBusiness
        is at line 793 and admit at line 1076.'
      rung3: Not reached; no production change.
---

# Fix Plan — Iteration 3

## Hypothesis
REQ-186 deleted `provisionInvite` from `apps/control-app/src/identity.ts`. Three older reconciliation test files still import it, so every test in them throws `TypeError: (0, __vite_ssr_import_2__.provisionInvite) is not a function` before it asserts anything. A newer file built on the REQ-186 vocabulary, `tests/reconciliation-identity-invite-provision-admission.workers.test.ts`, already covers every active AC those three files cover.

## Analysis
- **New root cause; the iteration 1–2 hypothesis is closed.** Iterations 1–2 dealt with the `accountId` → `businessId` and `account_id` → `business_id` rename. The builder fixed that: batch_fix_assessment report-2e8eaf29 reports 36/36 passing. After that, the REQ-186 commit was cherry-picked onto the branch and removed `provisionInvite`. All 32 failures in report-531ba768 come from that removal. The stack traces (report stdout) name these lines:
  - `tests/reconciliation-identity-multi-business-admission.workers.test.ts`: 346, 377, 400 and 437.
  - The same call in `tests/reconciliation-identity-invite-and-admission.workers.test.ts`, which has 25 call sites.
  - The same call in `tests/reconciliation-identity-business-lapse.workers.test.ts`, which has 10 call sites.
- **Production code is consistent with the reference state.**
  - Working tree `identity.ts` exports `provisionBusiness` (line 440) and `admit` (line 561), and no `provisionInvite`. The only mention left is the header comment at line 20, which explains why it was deleted.
  - `git show reconcile-src-BUNDLE-36:apps/control-app/src/identity.ts`: the only mention of `provisionInvite` is the comment at line 34. `provisionBusiness` is at line 793 and `admit` at line 1076.
  - The invite is now `invitePerson(env, scope, spec)` in `apps/control-app/src/people.ts:404`. It writes a person only, with no membership and no grant.
- **The specs already follow REQ-186.** The tests do not. The AC list for story-7b1025b8 was updated on 2026-11-01:
  - Superseded, with `superseded_by_uid` bundle-39edf66d: AC-1740, AC-2078 and AC-2079 (and AC-1750 earlier).
  - Rewritten so the invite writes nothing but the person and provisioning is a separate step: AC-1742, AC-1743, AC-1745, AC-2115 and AC-2173.
  - New REQ-186 ACs: AC-2169 to AC-2176.
- **Sanctioned fixture.** `tests/support/invite-account.ts` provides `inviteAccount(env, {email, accountName?, endsAt?, ...})`, which returns `{created, user, businessId, siteSlug}`. It composes `invitePerson` into the platform tenant with `provisionBusiness`. Its header says it is the test-side replacement for `provisionInvite`.
- **The three older files duplicate the newer one.** `reconciliation-identity-invite-provision-admission.workers.test.ts` uses the fixture and the new API. It has a UAT for every active AC in the three older files: AC1741–1749, AC1751–1760, AC2075–2077 and AC2112–2116, plus AC2169–2176.
  - Several tests have the **same describe and test name** in both files. Examples: "membership admits; entitlement does not test_UAT_AC2112_…", "a lapse explains itself test_UAT_AC2113_…" and "…AC2116…".
  - Because the quality report keys tests by full name, a failing old copy and a passing new copy of the same test cannot be told apart. This duplication is itself false evidence.
- **Not cross-suite contamination.** The failure is deterministic, an import of a missing export, and appears in every run. There is no polluter.
- **Out of scope; noted for the run, not batched.** These files also still import or call `provisionInvite`, but their tests do not belong to this story's ACs:
  - `tests/reconciliation-terms-of-service-gate.workers.test.ts` (3 references)
  - `tests/test_reconciliation_business_fulfilment.workers.test.ts` (3)
  - `tests/reconciliation-builder-businesses-endpoint.workers.test.ts` (4)

  They will fail the same way in their own stories' quality runs, and the same fixture migration applies to them.

## Spec Changes Made
None in this iteration. The REQ-186 AC rewrites and supersessions listed above were already applied before this run's quality check. The fix is test-only.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-identity-invite-provision-admission.workers.test.ts::…test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides` (and AC2113, AC2114, AC2116, AC2076, AC1760) — inter-test-dependency / identity collision — The full name is identical to a test in `reconciliation-identity-business-lapse.workers.test.ts`. Delete the older duplicate so each AC has one uniquely named UAT.
- `tests/reconciliation-builder-businesses-endpoint.workers.test.ts::invite` helper (line 106) — infra-reuse-gap — It wraps the deleted `provisionInvite`. Replace it with `inviteAccount` from `tests/support/invite-account.ts` when that story is next touched.

## Batches
**Batch 0 (single batch, test-only).** It contains all 32 failures, which come from one root cause in three files. Every active AC in the batch is already covered by the newer fixture-based file, so the batch also carries that file's tests and the AC2169–2176 tests as blast radius.

The builder should resolve the three stale files against the newer file, AC by AC:
1. **Delete the tests for superseded ACs** and do not replace them: AC1740 (both copies), AC2078 and AC2079.
2. **Remove each older test that duplicates a newer one.** Before deleting, confirm the newer test asserts at least what the old one did, read against the current AC wording.
3. **Keep any assertion that only the older test makes and that the current AC still requires.** Rewrite it onto `inviteAccount`, or onto `invitePerson` + `provisionBusiness` directly, in the newer file.
4. **Delete files left with nothing unique.** Most likely all three end up deleted.

Production code is not edited.

## Resolution ladder (REQ-938)
Batch 0 was decided at **rung 1**:
- **Rung 1.** REQ-186 is in scope and later than the REQ-167 and REQ-178 intents these tests were written for. It removes the one-call invite and splits it into `invitePerson` (person only) and `provisionBusiness`. The story's ACs were already rewritten or superseded to match. The stale tests change; the code does not.
- **Rung 2.** It agrees: at `reconcile-src-BUNDLE-36`, `identity.ts` has no `provisionInvite` export. It appears only in the comment at line 34. `provisionBusiness` is at line 793 and `admit` at line 1076.
- **Rung 3.** Not reached.
