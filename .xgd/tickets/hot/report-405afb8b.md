---
uid: report-405afb8b
id: REPORT-11178
type: report
title: 'Report: fix_plan for report-05835b4c'
created_by: xgd
created_at: '2026-11-07T21:30:56.955182+00:00'
updated_at: '2026-11-07T21:30:56.955182+00:00'
completed_at: null
last_field_updated: created_at
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
    dependency_tests:
    - story-0ea74f39 — the Contacts tab draws two axes test_UAT_AC2209_each_row_draws_stage_and_member_badge_separately
    - story-0ea74f39 — the Contacts tab draws two axes test_UAT_AC2211_styling_is_keyed_on_the_axis_never_a_value
    - test_UAT_FC_REQ-199_
    - test_UAT_FC_REQ-203_
    - test_UAT_FC_BUG-62_
    - test_UAT_FC_BUG-57_
    - test_UAT_FC_REQ_200_
    hypothesis: The terms-gate, contact-axes and contact-axes-migration reconciliation
      suites seed through APIs and schema that REQ-190/191/193/194/199/203 removed
      (provisionInvite, raw users INSERT without account_id/user_emails, invite-by-email,
      pre-rebaseline migrations 0001..0009, flat displayName), and AC-2333/2334/2335/2356/2357
      have only FC-named tests, so the evidence is stale fixtures and missing AC tokens,
      not wrong production code.
    instructions: 'Production code is correct; restore the evidence against it. (1)
      tests/reconciliation-terms-of-service-gate.workers.test.ts imports provisionInvite,
      which no longer exists: seed the invitee through the current path (tests/support/invite-account.ts
      inviteAccount, which goes through addContact and gives an entitled account with
      a site), so the terms gate is still the only thing that can stop them; under
      REQ-203 accepting provisions nothing for an account that already owns a business,
      so every AC2132..AC2142 claim stands unchanged. (2) tests/test_reconciliation_contact_axes.workers.test.ts''s
      local addContact does a raw INSERT into users without account_id (NOT NULL FK
      to accounts, REQ-194) and with an email column that now lives in user_emails
      (REQ-191): seed through the product addContact (apps/control-app/src/people.ts)
      or the support fixture, then set the per-case columns (tos_accepted_at, invited_at,
      pipeline_stage, first_seen_at) by UPDATE. AC2205 must follow its current AC
      text (REQ-199 wording: a sent or provider-failed invite moves Lead to Invited,
      never Member): invite existing contacts by id through PERSON_INVITE_PATH with
      the mail port captured as tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts
      does; no real mail may be sent. Check AC2206''s provisionBusiness call against
      the current signature. (3) tests/test_reconciliation_contact_axes_migration.workers.test.ts
      imports migration files deleted by the REQ-190 rebaseline: per the aligned_to_tip
      ruling, rewrite AC-2208 in place to drop the backfill half (keep: a contact
      on the baseline schema is stored at lead by default, and the seeded platform
      operator''s stored stage agrees with its invite stamp, read through the people
      API) and rewrite the test to run on applySchema''s baseline; read ensurePlatformOperator
      to learn the stamp it actually writes, not the old AC''s claim. (4) tests/test_reconciliation_contact_axes.test.ts''s
      person() fixture carries a flat displayName; rows draw displayNameOf(person)
      = person.name.displayName (REQ-193), so give the fixture the name record shape
      people.ts''s Person reports. (5) Give AC-2356, AC-2357 (tests/test_UAT_FC_BUG-57_smoke_checks.test.ts:
      published_cache_policy_matches_the_worker; control_origin_is_derived_from_the_default_apex
      plus a_non_default_origin_derives_nothing_and_skips) and AC-2333, AC-2334, AC-2335
      (tests/test_UAT_FC_REQ-200_apex_and_session.test.ts: apex_pages_and_assets_resolve_at_the_root;
      signed_out_by_default_and_signed_in_with_a_session; a_session_dependent_response_is_not_shared_cached)
      test_UAT_AC<N>_ tests that prove each AC''s own text; read each AC body first
      and keep every existing assertion.'
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
        REQ-191/193 address and name records, REQ-199 invite by selection with addContact
        separate, REQ-203 provision on acceptance) supersede the fixtures these older
        reconciliation tests seed with; rung 1 decides for the tests changing.
      rung2: At reconcile-src-BUNDLE-38 identity.ts exports no provisionInvite, db/migrations
        has no pipeline-stage migration (0009 is asset_grant_form_handle) and 0001_baseline.sql:449
        declares pipeline_stage DEFAULT 'lead' on users; people-name.js displayNameOf
        reads person.name.displayName.
      rung3: Every AC except AC-2208's backfill half stands and its test is repaired
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
---

# Fix Plan — Iteration 1

## Hypothesis
Three reconciliation suites (terms gate, contact axes origin and jsdom, contact axes migration) were written against the pre-rebaseline identity model, and five REQ-200/BUG-57 ACs were never given AC-token tests. The 18 failures and 23 orphans are therefore stale test fixtures and missing links. No production code is wrong.

## Analysis
Every failing test belongs to one of three files, and each file fails for a fixture reason that later intents in this bundle's timeline explain:

1. `tests/reconciliation-terms-of-service-gate.workers.test.ts` (AC-2132..AC-2142, all 11). The file imports `provisionInvite` from `apps/control-app/src/identity.ts`, and that export no longer exists in the working tree or at `reconcile-src-BUNDLE-38`. The import fails, so every case fails. The invitee seed has to move to the current path. `tests/support/invite-account.ts` `inviteAccount` seeds an entitled account with a site through `addContact` (REQ-199 records this as the account fixture). Under REQ-203, a person whose account already owns a business is not provisioned again on acceptance, and the terms gate is still the only thing that can stop them. So the file's premise survives unchanged.

2. `tests/test_reconciliation_contact_axes.workers.test.ts` (AC-2203..AC-2207). Its local `addContact` helper does a raw `INSERT INTO users (id, tenant_id, email, status, …)`. The baseline `users` table now has `account_id TEXT NOT NULL REFERENCES accounts` (REQ-194), and addresses live in `user_emails` (REQ-191), so the seed fails before any assertion runs. AC-2205 also POSTs `{email}` to `PERSON_INVITE_PATH`. Under REQ-199, invite acts on a selection of existing contact ids, through a passed-in mail port and the `invite` template, and moves the pipeline only for an attempted send. Under REQ-202 it also needs a token URL. The AC-2205 title has already been rewritten to the REQ-199 wording ("A sent or provider-failed invite moves the contact …"), so the test has to follow the AC rather than the old insert-or-update invite. The working harness for that route is `tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts`. AC-2206 calls `provisionBusiness(…, {accountUserId, …})`; check that signature against the current export.

3. `tests/test_reconciliation_contact_axes_migration.workers.test.ts` (AC-2208). It imports `db/migrations/0001_site_store.sql` … `0008_entitlement_revocation.sql` and treats `0009` as "the pipeline-stage migration". None of those files exist. The REQ-190 rebaseline folded them into `0001_baseline.sql`, where `pipeline_stage TEXT NOT NULL DEFAULT 'lead'` is a column of the baseline `users` table (tip `db/migrations/0001_baseline.sql:449`). At the reference ref, `0009` is `0009_asset_grant_form_handle.sql`. No intent in scope keeps a stage backfill: the bundle says the database "has been wiped rather than migrated". So AC-2208's migration half describes behaviour that cannot exist and is aligned to the reference state. Its seeded-operator half still stands and keeps a test.

4. `tests/test_reconciliation_contact_axes.test.ts` AC-2210 (jsdom). The fixture's `person()` carries `displayName` as a flat string. Rows draw `displayNameOf(person)`, which reads `person.name.displayName` (the name record, REQ-193). Every row therefore renders `No name yet`, and the facet assertion compares names. The fixture shape is stale and the panel is correct; the same file's AC-2209 passes because it does not read names. Fix the fixture to the `name` record shape that `people.ts` `Person` reports.

Orphan ACs, which have no `test_UAT_AC<N>_` test anywhere under `tests/`:
- AC-2356 (published cache policy asserted equal to the Worker's) is covered behaviourally by `test_UAT_FC_BUG-57_the_published_cache_policy_matches_the_worker`.
- AC-2357 (`--control-origin` defaults to the control app only for the declared apex) is covered by `test_UAT_FC_BUG-57_control_origin_is_derived_from_the_default_apex` and `…_a_non_default_origin_derives_nothing_and_skips`.
- AC-2333 (apex and every path outside `/site/` serve the configured apex site) is covered by `test_UAT_FC_REQ_200_apex_pages_and_assets_resolve_at_the_root`.
- AC-2334 (a page carrying account chrome is served naming the current state) is covered by `test_UAT_FC_REQ_200_signed_out_by_default_and_signed_in_with_a_session`.
- AC-2335 (a session-dependent response is `private, no-store`, no etag, never stored) is covered by `test_UAT_FC_REQ_200_a_session_dependent_response_is_not_shared_cached`.

These need AC-token tests: rename or add tests so each AC has its own `test_UAT_AC<N>_…`, without weakening the existing assertions. The remaining 18 orphans are the failing ACs above, and become linked once their tests run.

Isolation: this is the first iteration, so there is no history to separate contamination from real failures. All three causes are deterministic (a missing export, a NOT NULL constraint, a missing file, a fixture shape), not order-sensitive.

Environment note: workers-pool suites could not run in the planner's sandbox (`listen EPERM 127.0.0.1`). The workers diagnoses come from reading the source and schema, not from tracebacks. The jsdom AC-2210 failure was reproduced locally.

## Spec Changes Made
None by the planner. The batch carries an `aligned_to_tip` ruling for AC-2208. The builder rewrites AC-2208 in place to drop the migration-backfill half and keep the claims that new contacts store `lead` by default and that the seeded platform operator's stored stage agrees with its invite stamp.

## Weak Evidence Flags (preventative — best effort)
- `tests/test_reconciliation_contact_axes.workers.test.ts::addContact` (helper) — infra-reuse-gap — it reinvents contact seeding with raw SQL, which is exactly why it broke; use the product `addContact` or `tests/support/invite-account.ts`.
- `tests/reconciliation-terms-of-service-gate.workers.test.ts::mint/stubJwks` — infra-reuse-gap — the RS256 mint and JWKS stub are copied verbatim in at least two reconciliation files; prefer a shared support helper if one is registered.
- `tests/test_reconciliation_contact_axes.test.ts::person` (fixture) — weak-observation — a hand-built Person that drifted from `people.ts`'s `Person` without any error; typing it against the exported type would have caught the `name` record change.

## Batches
One batch. All failures share one root cause (fixtures predating REQ-190/191/193/194/199/203) and overlap on `identity.ts`, `people.ts` and the invite route. The orphan links for REQ-200/BUG-57 are test-name edits only and carry no risk of contradicting anything, so they sit in the same batch rather than in a separate cycle.

## Resolution ladder (REQ-938)
Batch 0: rung 1 decided. REQ-190 (rebaseline), REQ-194 (`account_id NOT NULL`), REQ-191/193 (address and name records), REQ-199 (invite by selection, Add as its own act) and REQ-203 (provision on acceptance) are all later than the stories that own AC-2132..AC-2142 and AC-2203..AC-2210, and they supersede the fixtures those tests use. For AC-2208's migration half, rung 2 confirms it: at `reconcile-src-BUNDLE-38` there is no pipeline-stage migration, and `0001_baseline.sql:449` declares the column with default `lead`. Every other test stands at rung 3 against unchanged production code.
