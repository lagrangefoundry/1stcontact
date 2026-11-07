---
uid: report-3cee3bab
id: REPORT-11180
type: report
title: 'Report: fix_plan for report-05835b4c'
created_by: xgd
created_at: '2026-11-07T21:43:51.245856+00:00'
updated_at: '2026-11-07T22:07:50.034253+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-05835b4c
  fix_iteration: 1
  items:
  - index: 0
    tests:
    - Terms of service gate — before acceptance test_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url
    - Terms of service gate — before acceptance test_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text
    - Terms of service gate — before acceptance test_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable
    - Terms of service gate — before acceptance test_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external
    - Terms of service gate — before acceptance test_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing
    - Terms of service gate — acceptance test_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time
    - Terms of service gate — acceptance test_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched
    - Terms of service gate — acceptance test_UAT_AC2137_after_acceptance_the_same_urls_answer_normally
    - Terms of service gate — acceptance test_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted
    - Terms of service gate — versions and configuration test_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor
    - Terms of service gate — versions and configuration test_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check
    - story-0ea74f39 — two axes at the origin test_UAT_AC2203_member_if_and_only_if_terms_accepted
    - story-0ea74f39 — two axes at the origin test_UAT_AC2204_contact_begins_at_lead
    - story-0ea74f39 — two axes at the origin test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp
    - story-0ea74f39 — two axes at the origin test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage
    - story-0ea74f39 — two axes at the origin test_UAT_AC2207_stage_is_the_stored_value_not_inferred
    - story-0ea74f39 — the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited
    - story-0ea74f39 — the Contacts tab draws two axes test_UAT_AC2210_two_facets_narrow_independently_and_combine
    - AC-2356 (orphaned acceptance criterion)
    - AC-2357 (orphaned acceptance criterion)
    - AC-2333 (orphaned acceptance criterion)
    - AC-2334 (orphaned acceptance criterion)
    - AC-2335 (orphaned acceptance criterion)
    - AC-2203 (orphaned acceptance criterion)
    - AC-2204 (orphaned acceptance criterion)
    - AC-2205 (orphaned acceptance criterion)
    - AC-2206 (orphaned acceptance criterion)
    - AC-2207 (orphaned acceptance criterion)
    - AC-2208 (orphaned acceptance criterion)
    - AC-2210 (orphaned acceptance criterion)
    - AC-2132 (orphaned acceptance criterion)
    - AC-2133 (orphaned acceptance criterion)
    - AC-2134 (orphaned acceptance criterion)
    - AC-2135 (orphaned acceptance criterion)
    - AC-2136 (orphaned acceptance criterion)
    - AC-2137 (orphaned acceptance criterion)
    - AC-2138 (orphaned acceptance criterion)
    - AC-2139 (orphaned acceptance criterion)
    - AC-2140 (orphaned acceptance criterion)
    - AC-2141 (orphaned acceptance criterion)
    - AC-2142 (orphaned acceptance criterion)
    dependency_tests:
    - test_UAT_AC2209_
    - test_UAT_AC2211_
    - test_UAT_FC_REQ-199_
    - test_UAT_FC_REQ-203_
    - test_UAT_FC_BUG-62_
    - test_UAT_FC_BUG-57_
    - test_UAT_FC_REQ_200_
    hypothesis: The terms-gate, contact-axes and contact-axes-migration reconciliation
      suites seed through APIs and schema that REQ-190/191/193/194/199/203 removed
      (the deleted provisionInvite export, a raw users INSERT without account_id or
      user_emails, invite-by-email, the pre-rebaseline migrations 0001..0009, a flat
      displayName), and AC-2333/2334/2335/2356/2357 have only FC-named tests. The
      evidence is stale fixtures and missing AC tokens, not wrong production code.
    instructions: 'Production code is correct and frozen; restore the evidence against
      it. Edit tests, ACs and stories only. (1) tests/reconciliation-terms-of-service-gate.workers.test.ts
      imports provisionInvite, which no longer exists. Seed the invitee through tests/support/invite-account.ts
      inviteAccount, which goes through the product addContact and yields an entitled
      account with a site. The terms gate is then still the only thing that can stop
      them (under REQ-203, accepting provisions nothing for an account that already
      owns a business), so every AC2132..AC2142 claim stands unchanged. (2) tests/test_reconciliation_contact_axes.workers.test.ts
      has a local addContact helper that does a raw INSERT into users without account_id
      (NOT NULL FK to accounts, REQ-194) and with an email column that now lives in
      user_emails (REQ-191). Replace it: seed through the exported product addContact,
      imported the same way tests/support/invite-account.ts imports it, or through
      that support fixture, then set the per-case columns (tos_accepted_at, invited_at,
      pipeline_stage, first_seen_at) with UPDATE. AC2205 must follow its current AC
      text (REQ-199 wording: a sent or provider-failed invite moves Lead to Invited,
      never Member). Invite existing contacts by id through PERSON_INVITE_PATH, with
      the mail port captured as tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts
      does. No real mail may be sent. Check AC2206''s provisionBusiness call against
      the current exported signature. (3) tests/test_reconciliation_contact_axes_migration.workers.test.ts
      imports migration files the REQ-190 rebaseline deleted. Per the aligned_to_tip
      ruling, rewrite AC-2208 in place to drop the backfill half and keep two claims:
      a contact on the baseline schema is stored at lead by default, and the seeded
      platform operator''s stored stage agrees with its invite stamp, read through
      the people API. Rewrite the test to run on applySchema''s baseline. Read ensurePlatformOperator
      to learn the stamp it actually writes; do not rely on the old AC''s claim. (4)
      tests/test_reconciliation_contact_axes.test.ts''s person() fixture carries a
      flat displayName. Rows draw displayNameOf(person), which reads person.name.displayName
      (REQ-193). Give the fixture the name-record shape of the exported Person type,
      typed against it so the next drift fails loudly. (5) Give AC-2356, AC-2357,
      AC-2333, AC-2334 and AC-2335 each a test_UAT_AC<N>_ test that proves that AC''s
      own text. Source material: AC-2356 from test_UAT_FC_BUG-57_the_published_cache_policy_matches_the_worker;
      AC-2357 from test_UAT_FC_BUG-57_control_origin_is_derived_from_the_default_apex
      and test_UAT_FC_BUG-57_a_non_default_origin_derives_nothing_and_skips (both
      in tests/test_UAT_FC_BUG-57_smoke_checks.test.ts); AC-2333 from test_UAT_FC_REQ_200_apex_pages_and_assets_resolve_at_the_root;
      AC-2334 from test_UAT_FC_REQ_200_signed_out_by_default_and_signed_in_with_a_session;
      AC-2335 from test_UAT_FC_REQ_200_a_session_dependent_response_is_not_shared_cached
      (all three in tests/test_UAT_FC_REQ-200_apex_and_session.test.ts). Read each
      AC body first and keep every existing assertion.'
    test_scope: test_UAT_AC2132_ or test_UAT_AC2133_ or test_UAT_AC2134_ or test_UAT_AC2135_
      or test_UAT_AC2136_ or test_UAT_AC2137_ or test_UAT_AC2138_ or test_UAT_AC2139_
      or test_UAT_AC2140_ or test_UAT_AC2141_ or test_UAT_AC2142_ or test_UAT_AC2203_
      or test_UAT_AC2204_ or test_UAT_AC2205_ or test_UAT_AC2206_ or test_UAT_AC2207_
      or test_UAT_AC2208_ or test_UAT_AC2209_ or test_UAT_AC2210_ or test_UAT_AC2211_
      or test_UAT_AC2333_ or test_UAT_AC2334_ or test_UAT_AC2335_ or test_UAT_AC2356_
      or test_UAT_AC2357_ or test_UAT_FC_REQ-199_ or test_UAT_FC_REQ-203_ or test_UAT_FC_BUG-62_
      or test_UAT_FC_BUG-57_ or test_UAT_FC_REQ_200_
    ladder:
      rung1: Later intents in scope (REQ-190 rebaseline, REQ-194 account_id NOT NULL,
        REQ-191/193 address and name records, REQ-199 invite by selection with Add
        as a separate act, REQ-203 provision on acceptance) supersede the fixtures
        these older reconciliation tests seed with; rung 1 decides that the tests
        change.
      rung2: At reconcile-src-BUNDLE-38 there is no provisionInvite export and no
        pipeline-stage migration (0009 is asset_grant_form_handle); the baseline declares
        pipeline_stage DEFAULT 'lead' on users, and displayNameOf reads person.name.displayName.
      rung3: Every AC except AC-2208's backfill half stands, and its test is repaired
        against unchanged production code; AC-2208 is aligned to the reference state.
    blocked_by_ruling:
      ruling: aligned_to_tip
      reason: AC-2208 asks that a pipeline-stage migration backfill existing contacts
        by their invite stamp; the REQ-190 rebaseline folded every prior migration
        into 0001_baseline.sql with pipeline_stage as a baseline column, and the bundle
        states the database was wiped rather than migrated, so no intent in scope
        requires a backfill and the reference has none to test.
      acs:
      - AC-2208
      tests:
      - story-0ea74f39 — the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited
      files:
      - tests/test_reconciliation_contact_axes_migration.workers.test.ts
      - tests/reconciliation-terms-of-service-gate.workers.test.ts
      - tests/test_reconciliation_contact_axes.workers.test.ts
      - tests/test_reconciliation_contact_axes.test.ts
      - tests/test_UAT_FC_BUG-57_smoke_checks.test.ts
      - tests/test_UAT_FC_REQ-200_apex_and_session.test.ts
      tip_evidence:
      - file: db/migrations/0001_baseline.sql
        lines: 419-449
      - file: apps/control-app/src/identity.ts
        lines: 1228-1260
      intent:
        ticket: bundle-7988e925
        sentence: There is no separate migration, because the database has been wiped
          rather than migrated and a baseline that has never been applied is not re-based
          by editing it.
  batches_pending: false
---

# Fix Plan — Iteration 1

## Hypothesis
Three reconciliation suites (terms gate, contact axes origin and jsdom, contact axes migration) were written against the pre-rebaseline identity model, and five REQ-200/BUG-57 ACs were never given AC-token tests. The 18 failures and 23 orphans are stale test fixtures and missing links. No production code is wrong.

## What changed from the refused filing (REPORT-11178)
This plan covers all 41 entries in the latest scoped quality report (REPORT-8615f260): 18 failing tests and 23 orphan ACs, each listed in the batch's `tests`. It was re-checked against the working tree for this invocation. `provisionInvite` now appears only in a comment in `identity.ts` and is exported nowhere at the reference. The raw `INSERT INTO users` and the imports of `0001_site_store.sql` / `0009_pipeline_stage.sql` are still in their test files. No `batch_fix_assessment` exists yet. The diagnosis is unchanged. The validator refused it for two mechanical reasons, and both are fixed:

1. **Inexact selectors.** `dependency_tests` named AC-2209 and AC-2211 by describe-prefixed full titles, which contain spaces. They are now the AC tokens `test_UAT_AC2209_` and `test_UAT_AC2211_`. Every `test_scope` term was already an exact token or `test_UAT_FC_<ID>_` prefix. Those prefixes were checked against `tests/`: REQ-200 tests use `test_UAT_FC_REQ_200_`, and the others use the hyphenated form.
2. **A frozen production file named in the instructions.** The brief cited `apps/control-app/src/people.ts` as where `addContact` and `Person` live. The builder only imports from it and never edits it, but under `code_frozen` naming it reads as an edit. It is also incompatible with the `aligned_to_tip` ruling, which requires that the batch edit no production file. The instructions now refer to the exported product `addContact` and `Person` type by symbol. The import path is reached the way `tests/support/invite-account.ts` already reaches it. The hypothesis and ladder were also cleared of production file names. Production paths appear only in `tip_evidence`, where the ruling requires them. No override is granted, because none is needed: this is a tests/ACs-only batch.

## Analysis
Every failing test belongs to one of four files, and each fails for a fixture reason that later intents in this bundle explain:

1. `tests/reconciliation-terms-of-service-gate.workers.test.ts` (AC-2132..AC-2142). It imports `provisionInvite`, which no longer exists at the working tree or at `reconcile-src-BUNDLE-38`, so the whole file fails at import. Seed through `tests/support/invite-account.ts` `inviteAccount`, which uses `addContact` and gives an entitled account with a site. Under REQ-203, acceptance provisions nothing for an account that already owns a business, so the terms gate is still the only barrier and the file's premise survives.
2. `tests/test_reconciliation_contact_axes.workers.test.ts` (AC-2203..AC-2207). Its local raw `INSERT INTO users (…, email, …)` has no `account_id`, which is NOT NULL since REQ-194, and addresses now live in `user_emails` (REQ-191). AC-2205 invites by `{email}`. Under REQ-199, invite acts on a selection of contact ids through a passed-in mail port, so the test follows the harness in `tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts`. AC-2206's `provisionBusiness` call must be checked against the current signature.
3. `tests/test_reconciliation_contact_axes_migration.workers.test.ts` (AC-2208). It imports migrations `0001`..`0008` and treats `0009` as the pipeline-stage migration. REQ-190 folded all of them into `0001_baseline.sql`, where `pipeline_stage TEXT NOT NULL DEFAULT 'lead'` is a baseline column (`0001_baseline.sql:449` at the reference). AC-2208's backfill half is aligned to the reference state, and its seeded-operator half keeps a test.
4. `tests/test_reconciliation_contact_axes.test.ts` AC-2210 (jsdom). The `person()` fixture carries a flat `displayName`, but rows read `person.name.displayName` (REQ-193), so every row shows "No name yet". This was reproduced locally.

Orphans that need AC-token tests (covered today only by FC-named tests):
- AC-2356 is covered by `test_UAT_FC_BUG-57_the_published_cache_policy_matches_the_worker`.
- AC-2357 is covered by `test_UAT_FC_BUG-57_control_origin_is_derived_from_the_default_apex` and `test_UAT_FC_BUG-57_a_non_default_origin_derives_nothing_and_skips`.
- AC-2333 is covered by `test_UAT_FC_REQ_200_apex_pages_and_assets_resolve_at_the_root`.
- AC-2334 is covered by `test_UAT_FC_REQ_200_signed_out_by_default_and_signed_in_with_a_session`.
- AC-2335 is covered by `test_UAT_FC_REQ_200_a_session_dependent_response_is_not_shared_cached`.

The other 18 orphans are the failing ACs above, and they link once their tests run.

Isolation: this is the first iteration, so there is no history yet. All four causes are deterministic (a missing export, a NOT NULL constraint, missing files, a fixture shape).

Environment: workers-pool suites cannot bind `127.0.0.1` in the planner sandbox. The workers diagnoses therefore come from reading source and schema, not from tracebacks.

## Spec Changes Made
None by the planner. The batch carries an `aligned_to_tip` ruling for AC-2208. The builder rewrites AC-2208 in place, keeping two claims: a contact is stored at `lead` by default, and the seeded operator's stored stage agrees with its invite stamp.

## Weak Evidence Flags (preventative — best effort)
- `tests/test_reconciliation_contact_axes.workers.test.ts::addContact` (helper) — infra-reuse-gap — reinvents contact seeding in raw SQL, which is why it broke; use the product `addContact` or `tests/support/invite-account.ts`.
- `tests/reconciliation-terms-of-service-gate.workers.test.ts::mint/stubJwks` — infra-reuse-gap — RS256 mint and JWKS stub are copied across reconciliation files; prefer a shared support helper.
- `tests/test_reconciliation_contact_axes.test.ts::person` (fixture) — weak-observation — hand-built Person drifted silently; type it against the exported `Person`.

## Batches
One batch. All failures share one root cause (fixtures that predate REQ-190/191/193/194/199/203) and overlap on the identity and people modules and the invite route. The REQ-200/BUG-57 orphan links are test-name additions with no risk of contradiction, so they sit in the same batch.

## Resolution ladder (REQ-938)
Batch 0: rung 1 decided. REQ-190, REQ-194, REQ-191/193, REQ-199 and REQ-203 are all later than the stories that own AC-2132..AC-2142 and AC-2203..AC-2211, and they supersede the fixtures those tests use. For AC-2208's backfill half, rung 2 confirms it: the reference has no pipeline-stage migration, and the baseline declares the column with default `lead`. Every other test stands at rung 3 against unchanged production code.

## Aligned to running code (REQ-895)

AC-2208 asks that a pipeline-stage migration backfill existing contacts by their invite stamp; the REQ-190 rebaseline folded every prior migration into 0001_baseline.sql with pipeline_stage as a baseline column, and the bundle states the database was wiped rather than migrated, so no intent in scope requires a backfill and the reference has none to test.

- **ACs retired or rewritten**: AC-2208
- **Failing tests covered**: story-0ea74f39 — the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited
- **Tip evidence** (read at `reconcile-src-BUNDLE-38`):
  - `db/migrations/0001_baseline.sql` lines 419-449
  - `apps/control-app/src/identity.ts` lines 1228-1260
- **Intent** `bundle-7988e925`: "There is no separate migration, because the database has been wiped rather than migrated and a baseline that has never been applied is not re-based by editing it."