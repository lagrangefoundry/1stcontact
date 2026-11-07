---
uid: report-72de7cec
id: REPORT-11109
type: report
title: 'Report: fix_plan for story-7b1025b8'
created_by: xgd
created_at: '2026-11-07T07:44:33.004631+00:00'
updated_at: '2026-11-07T07:44:33.004631+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-7b1025b8
  fix_iteration: 7
  items:
  - index: 0
    tests:
    - the invite control test_UAT_AC2175_the_invite_control_is_owner_only_and_its_dialog_says_no_message_is_sent
    - story-7b1025b8 — the invite modal test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent
    - the account is a record people belong to test_UAT_AC2253_an_invite_mints_an_opaque_account_and_the_schema_refuses_a_person_without_one
    - the account is a record people belong to test_UAT_AC2254_an_account_holding_two_people_makes_both_owners_of_its_new_business
    - the account is a record people belong to test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value
    - a business is owned by an account test_UAT_AC1742_provisioning_writes_an_account_owned_business_grant_and_unnamed_starter_site
    - a business is owned by an account test_UAT_AC2115_a_non_null_grant_subject_is_an_account_key_and_the_capacity_grant_names_none
    - the invite is a transition, not a creation test_UAT_AC2169_inviting_a_known_contact_promotes_that_row_and_reports_created
    - the invite is a transition, not a creation test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column
    - the invite is a transition, not a creation test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_overwrites_a_name
    - the invite is a transition, not a creation test_UAT_AC1743_re_inviting_a_known_address_reports_the_person_and_creates_nothing
    - the invite is a transition, not a creation test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login
    - who may invite test_UAT_AC2172_only_an_owner_may_invite_and_every_refusal_writes_nothing
    - the invite writes no membership and no grant test_UAT_AC2173_the_invite_writes_no_membership_or_grant_and_the_invitee_is_refused_no_membership
    - the invite writes no membership and no grant test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject
    - provisioning a business test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site
    - invite plus provisioning makes a customer test_UAT_AC2176_invite_provision_sign_in_reaches_only_that_business_and_its_account
    - login binds, and provisions nothing test_UAT_AC1745_admission_refuses_an_unconfigured_platform_tenant_naming_what_is_missing
    - the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason
    - a person and their addresses test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary
    - a person and their addresses test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates
    - a person and their addresses test_UAT_AC2248_admission_and_the_invite_resolve_a_person_through_any_of_their_addresses
    - a person and their addresses test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login_with_the_schema_casefolding
    - a re-invite test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_supersedes_an_existing_current_name
    - AC-2257 (orphaned acceptance criterion)
    - AC-2115 (orphaned acceptance criterion)
    - AC-2254 (orphaned acceptance criterion)
    - AC-1742 (orphaned acceptance criterion)
    - AC-2247 (orphaned acceptance criterion)
    - AC-2170 (orphaned acceptance criterion)
    - AC-2173 (orphaned acceptance criterion)
    - AC-2176 (orphaned acceptance criterion)
    - AC-1745 (orphaned acceptance criterion)
    - AC-1759 (orphaned acceptance criterion)
    dependency_tests:
    - test_UAT_AC2336_
    - test_UAT_AC2337_
    - test_UAT_AC2338_
    - test_UAT_FC_REQ-199_
    - test_UAT_FC_REQ-186_
    - test_UAT_FC_BUG-53_
    hypothesis: The bundle's REQ-199/REQ-202/REQ-203 commits replaced invite-by-address
      with add (POST /api/people/add) plus invite-by-ids (POST /api/people/invite
      {ids}), moved invitePerson out of people.ts into invites.ts with an injected
      mail port, and made admit accept a not-yet-signed-up invitee holding nothing;
      story-7b1025b8's older workers suites and invite-control test still drive the
      removed surface, and separately builder/people.js clears the selection after
      every send, contradicting REQ-199.
    instructions: 'Two different fixes in one batch. (1) PRODUCTION FIX, the only
      code change allowed: in apps/control-app/src/builder/people.js, the invite modal''s
      Send handler (reference lines 1576-1580) calls selected.clear() and syncInvite()
      unconditionally after transport.invite returns. REQ-199 requires that ''the
      selection clears only once something was sent'' and that ''the selection survives
      a send in which nothing was sent''. Make the clear conditional on at least one
      result having actually gone out, so an all-refused send leaves every row checked
      and Invite enabled. Keep the existing close-on-all-sent (BUG-318) and stay-open-on-any-refusal
      behaviour. Extend AC2339''s tab UAT so the mixed send also asserts the selection
      is cleared when something was sent; at the moment a fix that never clears would
      pass. (2) TEST REALIGNMENT, tests only: the ACs are already rewritten to the
      new surface (AC-2169/1743/1744/2171/2172 at 07:21Z; AC-2173 and AC-2176 in this
      plan; AC-2175 is superseded). Read each AC body before touching its test. (a)
      Delete the AC2175 UAT in tests/reconciliation-identity-invite-control.test.ts:
      its AC is superseded and the Add-dialog behaviour it described is proven by
      AC2336. (b) In tests/reconciliation-identity-accounts.workers.test.ts and tests/reconciliation-identity-invite-provision-admission.workers.test.ts,
      replace every invitePerson(identityEnv(), scope, {email}) imported from people.ts,
      which no longer exports it, with addContact from people.ts, plus invitePeople
      from invites.ts where the AC needs the invited transition, using a recording
      mail port the way tests/test_reconciliation_contacts_add_invite.workers.test.ts
      does. (c) In all three workers files, replace postInvite(token, {email}) with
      the add route followed by the invite route posting {ids:[contactId]}. tests/test_reconciliation_contacts_add_invite.workers.test.ts
      already passes on the new surface: reuse its helpers and pattern rather than
      writing a third. Where that file already proves an AC (AC2169, AC1743, AC1744,
      AC2171, AC2172, AC2248, AC2253, AC2339), the old-file UAT is a stale duplicate
      and may be deleted. Where it does not (AC2170, AC2173, AC2176, AC2247, AC2257,
      AC1742, AC2115, AC2254, AC1745, AC1759, the 10 orphans), the old UAT must be
      moved onto the new surface and end green, because those ACs have no other evidence.
      (d) AC2173: assert per the rewritten AC. The invite writes no membership and
      no grant, an invitee with member_since null whose account owns no business is
      admitted with an EMPTY business set, not refused (REQ-203, identity.ts admit
      signingUp branch), provisioning then lists exactly that business, and a withdrawn
      membership still refuses no_membership. (e) AC2176: add, invite by id, provision,
      sign in, accept terms, exactly one business (accept does not provision a second,
      because ensureOwnBusiness is idempotent on tenants.owner_account_id), /account
      200, provisioning route 404. (f) AC1745 and AC1759: once the import and invite
      plumbing is fixed, re-check their assertions against BUG-62 (commit d1cac8424d,
      ''a refusal that claims nothing ended, and says why in the log''). If the logged
      refusal shape changed, assert the reference shape the AC describes. Do not edit
      ACs. The .workers.test.ts suites need local port binding to run.'
    test_scope: test_UAT_AC2175_ or test_UAT_AC2339_ or test_UAT_AC2253_ or test_UAT_AC2254_
      or test_UAT_AC2257_ or test_UAT_AC1742_ or test_UAT_AC2115_ or test_UAT_AC2169_
      or test_UAT_AC2170_ or test_UAT_AC2171_ or test_UAT_AC1743_ or test_UAT_AC1744_
      or test_UAT_AC2172_ or test_UAT_AC2173_ or test_UAT_AC2176_ or test_UAT_AC1745_
      or test_UAT_AC1759_ or test_UAT_AC2247_ or test_UAT_AC2248_ or test_UAT_AC2336_
      or test_UAT_AC2337_ or test_UAT_AC2338_ or test_UAT_FC_REQ-199_ or test_UAT_FC_REQ-186_
      or test_UAT_FC_BUG-53_
    ladder:
      rung1: 'Decided: REQ-199 (in scope, later than REQ-186) replaces invite-by-address
        with add plus invite-by-ids and requires that ''the selection survives a send
        in which nothing was sent''; REQ-203 (in scope) admits a not-yet-signed-up
        invitee holding nothing, so AC-2175 is superseded, AC-2173/AC-2176 were rewritten,
        and people.js must change for AC2339.'
      rung2: reconcile-src-BUNDLE-38 agrees on the route shape (router.ts PERSON_INVITE_PATH
        POST reads body.ids and refuses an empty list; identity.ts 1122-1165 admits
        the signingUp case) but builder/people.js 1576-1580 clears the selection unconditionally,
        contradicting both REQ-199 and its own comment; rung 1 wins there.
      rung3: The AC2339 tab UAT stands as written and the code changes; every other
        UAT in the batch is rewritten to the add/invite-by-ids surface or retired
        where its AC is superseded or already proven on the new surface.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-199, an intent in this bundle's scope, states 'the selection
        clears only once something was sent' and lists 'every selected contact gets
        an outcome line, and the selection survives a send in which nothing was sent'
        among its acceptance points; AC-2339 encodes it and its UAT fails because
        people.js clears the selection unconditionally after every send. The test
        is right and the code is wrong; the change is confined to making that clear
        conditional.
      files:
      - apps/control-app/src/builder/people.js
      tip_evidence:
      - file: apps/control-app/src/builder/people.js
        lines: 1566-1602
      trust_boundary: false
---

# Fix Plan — Iteration 7

## Hypothesis
The bundle's REQ-199 / REQ-202 / REQ-203 commits replaced the invite-by-address surface (the invite now takes `{ids}` of existing contacts, `invitePerson` left `people.ts`, adding is `POST /api/people/add`, and a not-yet-signed-up invitee is admitted with nothing). Story-7b1025b8's three older workers test files and its invite-control test still drive the removed surface. Separately, `builder/people.js` clears the selection after every send, which contradicts REQ-199.

## Analysis
Iteration 6 (REPORT-10865) left all 35 tests green. Every failure here comes from the code that arrived with the bundle's later commits (7bebebd500 REQ-199, 8edb95b996 REQ-202, 3cc5a20e4a REQ-203, d1cac8424d BUG-62), not from a regression in the earlier fix.

**Failure classes (observed):**
1. `tests/reconciliation-identity-person-addresses-names.workers.test.ts`: `postInvite(token, {email}, …)` is refused with `400 {"error":"Nobody was selected, so there is nobody to invite."}`. At `reconcile-src-BUNDLE-38`, `apps/control-app/src/router.ts` (the `PERSON_INVITE_PATH` POST handler) reads `body.ids` and refuses an empty list. This affects AC2257, AC2248, AC1744, AC2171, AC2247 and anything else that posts an address.
2. `tests/reconciliation-identity-accounts.workers.test.ts` and `tests/reconciliation-identity-invite-provision-admission.workers.test.ts` import `invitePerson` from `../apps/control-app/src/people`. That export no longer exists: `people.ts` now exports `addContact` and `markInvited`, and `invites.ts` exports `invitePerson(deps, contactId)` / `invitePeople(deps, ids)` with an injected mail port. Every call site gets `undefined` (AC2253, AC2254, AC2257, AC1742, AC2115, AC2173). The admission file's `postInvite(token, {email})` calls fail exactly as in class 1 (AC2169, AC2170, AC2171, AC1743, AC1744, AC2172, AC2176, and probably AC1745 and AC1759 through their setup). AC1745 and AC1759 should also be checked against BUG-62's refusal-logging change (d1cac8424d).
3. `tests/reconciliation-identity-invite-control.test.ts` (AC2175) expects an invite dialog that takes an address and says "no message is sent". At the reference the Invite control needs a checked selection and sends mail. The address dialog is now "Add a contact" (`builder/people.js` ~1405). **AC-2175 is already `superseded`** (superseded_by bundle-7988e925, set 07:21Z), so its test should be retired, not repaired.
4. `tests/test_reconciliation_contacts_add_invite_tab.test.ts` AC2339 (ran locally, fails at line 322: "the refused contact is no longer selected"). At `reconcile-src-BUNDLE-38`, `apps/control-app/src/builder/people.js` lines 1576-1580 call `selected.clear(); syncInvite()` unconditionally after `transport.invite` returns, even though the comment above them says "THE SELECTION IS CLEARED ONLY ONCE SOMETHING WAS SENT". `git log -S` shows the code has done this since 73302982b0. **This is a production defect against an in-scope intent, so it needs a code change.**

**Coverage already on the new surface:** `tests/test_reconciliation_contacts_add_invite.workers.test.ts` (same story, currently passing) already proves AC2336, AC2253, AC1743, AC1744, AC2248, AC2171, AC2172, AC2169, AC2337, AC2338 and AC2339 through `/api/people/add` and `/api/people/invite` with ids. Several old-file UATs for the same ACs are now stale duplicates. The builder may delete those, provided each AC keeps a passing UAT. The ACs with no UAT on the new surface yet must be moved onto it: AC2170, AC2173, AC2176, AC2247, AC2257, AC1742, AC2115, AC2254, AC1745, AC1759. These are the 10 orphan ACs, and they clear once each has a passing UAT.

**Isolation:** not contamination. The failures are deterministic surface mismatches: the same 400 / missing export on every run. I could not run the `.workers.test.ts` files in this planner sandbox (local port binding EPERM). The node-environment files were run and fail as described.

## Spec Changes Made
- **AC-2173** (acceptance_criterion-84cb722b), rewritten in place. REQ-203 supersedes "an invited person holding no business is refused as no_membership". An invitee who has not signed up (`member_since` null) and whose account owns no business is now admitted with an empty business set. Withdrawn or lost memberships (account already owns a business) are still refused `no_membership`. The invite still writes no membership and no grant. Reference: `apps/control-app/src/identity.ts` 1122-1165 at `reconcile-src-BUNDLE-38`.
- **AC-2176** (acceptance_criterion-a816942d), rewritten in place. The sequence is now add → invite by id → provision → sign in → accept terms → exactly one business (REQ-199 + REQ-203).
- Already aligned by an earlier pass this run (07:21-07:22Z), no change: AC-2169, AC-1743, AC-1744, AC-2171, AC-2172 (rewritten to the add/invite split), and AC-2175 (superseded).

## Weak Evidence Flags (preventative — best effort)
- tests/test_reconciliation_contacts_add_invite_tab.test.ts::test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent — weak-observation (first half) — the mixed-send half never checks whether the selection was cleared after a send in which something *was* sent, so a fix that never clears would also pass. Assert both directions.
- tests/reconciliation-identity-person-addresses-names.workers.test.ts (local `postInvite` helper, line ~115) — infra-reuse-gap — it re-implements request plumbing that `tests/test_reconciliation_contacts_add_invite.workers.test.ts` already does against the new routes. Share one add+invite helper rather than keeping two shapes in step.
- tests/test_UAT_FC_REQ-186_invite_control.test.ts — drifted-intent risk — it is a feature test for the pre-REQ-199 invite control. Confirm it still asserts something REQ-199 kept, rather than passing over a superseded shape.

## Batches
**One batch (index 0).** All four failure classes sit on one surface: the people add/invite routes, the `invites.ts` composition and the people panel. They share fixtures (`tests/support/invite-account.ts`, `tests/support/contact.ts`), and the AC2339 code fix and the AC2175 retirement both touch the same panel. Splitting them would hide the overlap.

## Mode overrides (REQ-892)
- Batch 0 — `code_frozen` — files: `apps/control-app/src/builder/people.js` — rung 1. REQ-199 (in scope) requires "every selected contact gets an outcome line, and the selection survives a send in which nothing was sent" and "the selection clears only once something was sent". At `reconcile-src-BUNDLE-38`, `people.js` 1576-1580 clears unconditionally, contradicting both REQ-199 and the code's own comment. The test is right and the code is wrong. Dependency tests: the other people-panel UATs on the invite path (AC2336, AC2337, AC2338, FC REQ-199, FC REQ-186, FC BUG-53).

## Resolution ladder (REQ-938)
Batch 0:
- **Rung 1 decides for most of it.** REQ-199 (later than REQ-186) replaces invite-by-address with add + invite-by-ids and requires the selection to survive an all-refused send. REQ-203 (later than REQ-186) admits a not-yet-signed-up invitee who holds nothing. So: the stale tests are rewritten or retired (AC2175 superseded; AC2173 and AC2176 rewritten above), and `people.js` changes for AC2339.
- **Rung 2** (`reconcile-src-BUNDLE-38`) agrees with rung 1 on the route shape: router.ts reads `body.ids`; identity.ts 1122-1165 has the `signingUp` admission. It disagrees only on the selection clear at people.js 1576-1580, where rung 1 wins.
- **Rung 3:** the AC2339 UAT stands as written; every other UAT is rewritten to the surface that rungs 1 and 2 show.
