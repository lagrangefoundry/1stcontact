---
uid: report-34b92c94
id: REPORT-11167
type: report
title: 'Report: fix_plan for story-e0ca0a36'
created_by: xgd
created_at: '2026-11-07T20:47:42.408850+00:00'
updated_at: '2026-11-07T20:47:42.408850+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-e0ca0a36
  fix_iteration: 8
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
    hypothesis: No failures remain; the only open item is the code_frozen handoff
      report-ada484cc from a confirmed_green no-op builder run, which is declined.
    instructions: Confirm only; there is no evidence gap and no mode rule is in the
      way. Run the batch scope on HEAD and make no edits to production code, tests,
      ACs or the story. Expect all 13 passwordless sign-in workers UATs and the REQ-202
      SCHEMA_STATEMENTS drift test to pass, as in report-ad445cc7 and report-feb684fe.
      If a test is red, put its exact error text in the assessment instead of editing.
    test_scope: test_UAT_AC2347_ or test_UAT_AC2348_ or test_UAT_AC2349_ or test_UAT_AC2350_
      or test_UAT_AC2351_ or test_UAT_AC2352_ or test_UAT_AC2353_ or test_UAT_AC2354_
      or test_UAT_FC_REQ-202_ or test_UAT_AC2343_ or test_UAT_AC2344_ or test_UAT_AC2345_
      or test_UAT_AC2346_ or test_UAT_AC2355_
    ladder:
      rung1: No intent in scope demands a code change beyond the sessions-schema alignment
        delivered in iteration 5 (2034ff1df4).
      rung2: The reference state sessions schema matches what HEAD contains after
        2034ff1df4.
      rung3: 'Decided here: the tests stand and pass on HEAD (report-ad445cc7, 13/13),
        so code_frozen stays in force and no override is needed.'
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 3 decides: the builder reported confirmed_green with blocked_by
        null and proposed no change; every batch test passes on HEAD, so the work
        is complete within code_frozen and no production edit is required.'
      files:
      - tests/test_reconciliation_passwordless_sign_in.workers.test.ts
---

# Fix Plan — Iteration 8

## Hypothesis
Nothing is failing. All 13 passwordless sign-in UATs (AC2343–AC2355) pass on HEAD. The only thing still open is the `code_frozen` blocked_by handoff (report-ada484cc). It came from a builder run that changed nothing, reported `confirmed_green` and set `blocked_by: null`, so this plan rules on it again as **declined**.

## Analysis
- This iteration's input lists 0 failures. The latest scoped quality report, report-ad445cc7 (commit 59ec1df5b3), passes: 13/13 tests for AC2343–AC2355, and lint, build and preflight are clean.
- The iteration-6 batch-0 builder (report-feb684fe, parent report-2ffc351d) assessed `status: pass`, `edits: none`, `blocked_by: null`. Its runs:
  - workers suite: 13/13 passed;
  - `tests/test_UAT_FC_REQ-202_passwordless_wiring.test.ts`: 7/7 passed, including `every_statement_in_SCHEMA_STATEMENTS_is_in_the_migration`.
- Root cause of the original failures: the `sessions` schema did not match the passwordless-auth component's nine-column table. This was fixed in iteration 5 by the rung-2 override (report-952055fa), committed as 2034ff1df4. Nothing has changed since.
- The last run commit records `test_fix_pending_handoff_gate: fail`. The only handoff on record for this subject is report-ada484cc (rule `code_frozen`, proposed_change none). This plan carries the same tests and rules on it again, declined, so the gate can close it. There is no new blocked_by report, no stuck test, and no XGD tooling bug to record.
- Hypothesis history: the plans since iteration 5 have been confirm-only, with no fix hypothesis, and the failures have stayed cleared. The anti-repetition rule does not apply.
- Out of scope, carried over from earlier plans: `tests/test_reconciliation_business_scope_operator.workers.test.ts` fails to load because `db/migrations/0005_operator_membership.sql` is missing from this tree. That test belongs to another story.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- Batch 0 is confirm-only.
  - Tests: the AC2347–AC2354 UATs and the REQ-202 SCHEMA_STATEMENTS drift test.
  - Dependency tests: AC2343, AC2344, AC2345, AC2346 and AC2355.
  - It carries the declined ruling on the `code_frozen` handoff and makes no edits.

## Resolution ladder (REQ-938)
- Batch 0 is decided at rung 3.
  - Rung 1: no intent in scope demands a code change beyond the schema alignment iteration 5 already delivered.
  - Rung 2: the reference state's sessions schema matches HEAD.
  - Rung 3: the tests stand and pass on HEAD, so `code_frozen` stays in force and no override is needed.
