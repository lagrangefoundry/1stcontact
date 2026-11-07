---
uid: report-2ffc351d
id: REPORT-11162
type: report
title: 'Report: fix_plan for story-e0ca0a36'
created_by: xgd
created_at: '2026-11-07T20:32:09.980190+00:00'
updated_at: '2026-11-07T20:32:09.980190+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-e0ca0a36
  fix_iteration: 6
  items:
  - index: 0
    tests:
    - tests/test_reconciliation_passwordless_sign_in.workers.test.ts::test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused
    - tests/test_reconciliation_passwordless_sign_in.workers.test.ts::test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read
    - tests/test_reconciliation_passwordless_sign_in.workers.test.ts::test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link
    - tests/test_reconciliation_passwordless_sign_in.workers.test.ts::test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable
    - tests/test_reconciliation_passwordless_sign_in.workers.test.ts::test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned
    - tests/test_reconciliation_passwordless_sign_in.workers.test.ts::test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through
    - tests/test_reconciliation_passwordless_sign_in.workers.test.ts::test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access
    - tests/test_reconciliation_passwordless_sign_in.workers.test.ts::test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links
    - test_UAT_FC_REQ-202_every_statement_in_SCHEMA_STATEMENTS_is_in_the_migration
    dependency_tests:
    - test_UAT_AC2343_
    - test_UAT_AC2344_
    - test_UAT_AC2345_
    - test_UAT_AC2346_
    - test_UAT_AC2355_
    hypothesis: 'The code_frozen blocked_by handoff is a harness artifact of a confirmed_green
      no-op builder run (blocked_by: null, fingerprint unchanged), not a real mode-rule
      block.'
    instructions: Confirm only; no evidence gap exists and no mode rule is in the
      way. Run the batch scope on HEAD and make no edits to production code, tests,
      ACs or the story. Expect all 13 passwordless sign-in workers UATs and the REQ-202
      SCHEMA_STATEMENTS drift test to pass, as they did in report-d37aaf50 and report-ada484cc.
      If a test is red, report its exact error text in the assessment rather than
      editing anything.
    test_scope: test_UAT_AC2347_ or test_UAT_AC2348_ or test_UAT_AC2349_ or test_UAT_AC2350_
      or test_UAT_AC2351_ or test_UAT_AC2352_ or test_UAT_AC2353_ or test_UAT_AC2354_
      or test_UAT_FC_REQ-202_ or test_UAT_AC2343_ or test_UAT_AC2344_ or test_UAT_AC2345_
      or test_UAT_AC2346_ or test_UAT_AC2355_
    ladder:
      rung1: No intent in scope demands a code change beyond the sessions-schema alignment
        already delivered in iteration 5.
      rung2: The reference state's sessions schema matches what HEAD now contains
        after commit 2034ff1df4.
      rung3: 'Decided here: the tests stand and pass on HEAD, so code_frozen remains
        in force and no override is needed.'
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 3 decides: the builder reported confirmed_green with blocked_by
        null and proposed no change; every batch test passes on HEAD, so the work
        is complete within code_frozen and no production edit is required.'
      files:
      - tests/test_reconciliation_passwordless_sign_in.workers.test.ts
---

# Fix Plan — Iteration 6

## Hypothesis
The `code_frozen` blocked_by handoff (report-ada484cc) is an artifact. The batch-0 builder of report-81097028 reported `status: confirmed_green` with `blocked_by: null` and made no edits (no_op_guard report-f8e3227f, fingerprint unchanged). No mode rule is blocking anything, so the rule stands and is declined.

## Analysis
- This iteration's input lists 0 failures. The latest scoped quality report (report-d37aaf50) is clean: 13 passed, 0 failed for AC2343–AC2355, with lint, build and preflight also clean.
- Root cause of the earlier failures (report-229bfbbf): the installed passwordless-auth component writes a nine-column `sessions` table, but the baseline schema did not match it. Iteration 5 (override plan report-952055fa, rung 2) aligned the schema, committed as 2034ff1df4.
- In report-81097028 the builder re-ran the whole batch scope on HEAD. All 13 workers tests and all 7 REQ-202 wiring tests passed. It changed nothing, and its assessment says `blocked_by: null`. The harness still filed a `blocked_by_handoff` with rule `code_frozen` and "proposed_change: none stated".
- The previous iteration-6 plan (report-1036fca1) filed zero items and did not rule on that handoff, so plan validation failed. This plan fixes that. It rules on the handoff as **declined** (no edit the rule governs is needed), on a batch that carries the same tests. The batch is confirm-only.
- Also, to avoid repeating the fell-through reason on report-81097028, this plan's fields name no production file.
- Out of scope, recorded for the run: `tests/test_reconciliation_business_scope_operator.workers.test.ts` fails to load because a migration file it opens is missing from this tree. It belongs to another story.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- Batch 0 is confirm-only. It covers the eight AC2347–AC2354 UATs and the REQ-202 SCHEMA_STATEMENTS drift test, with AC2343/2344/2345/2346/2355 as dependency tests. It carries the `declined` ruling on the `code_frozen` handoff. The builder runs the scope and edits nothing.

## Resolution ladder (REQ-938)
- Batch 0 was decided at rung 3. Rung 1: no intent in scope asks for a code change beyond what iteration 5 already delivered. Rung 2: the reference state's schema matches what HEAD now has (aligned in iteration 5). Rung 3: the tests stand and they pass on HEAD, so `code_frozen` stays in force and no override is needed.
