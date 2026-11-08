---
uid: report-02c0f7a4
id: REPORT-11355
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T08:15:19.808853+00:00'
updated_at: '2026-11-08T08:15:19.808853+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - AC-1817 (orphaned acceptance criterion)
    - AC-1818 (orphaned acceptance criterion)
    - a turn that changes the site says so where the change happened test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion
    - a turn that changes the site says so where the change happened test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent
    - a turn that changes the site says so where the change happened test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one
    - REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved
    dependency_tests:
    - test_UAT_FC_REQ_209_
    hypothesis: 'All iteration-2 failures are fixed at HEAD: the REQ-209 font-metrics
      failure was a fixture defect (round C overshoots cap height), fixed test-only
      in a5a337c47c and verified in a real browser by gate REPORT-11348 at 11e05a2224
      (0 failed, 0 skipped); the AC1054/AC1817/AC1818 change-signal tests pass.'
    instructions: Verify only; make no edits. Keep a5a337c47c (the flat-capital 'HE'
      cap-height fixture in the REQ-209 browser test). Run tests and dependency_tests
      and confirm they are green. If the REQ-209 browser test skips because Chromium
      cannot launch, report that skip as missing evidence, not as a pass. If any listed
      test fails, report the exact assertion and file:line and do not widen scope.
    ladder:
      rung1: 'Decided here: REQ-209 requires font metrics measured from the face that
        resolved, which HEAD satisfies; the earlier failure was the fixture''s round-glyph
        overshoot, not the measurement.'
      rung2: Not needed; no production behaviour is in question.
      rung3: The tests stand as fixed in a5a337c47c and pass at gate REPORT-11348;
        no production code change is demanded.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 1: REPORT-11353 proposes no change and asks for no grant; its
        one open item (fixed_unverified, font metrics) is verified by gate REPORT-11348
        at 11e05a2224, which contains a5a337c47c and passes the test with 0 skipped.
        No production code is needed, so code_frozen stands and the batch edits no
        files.'
      files: []
    test_scope: test_UAT_AC1054_ or test_UAT_AC1817_ or test_UAT_AC1818_ or test_UAT_FC_REQ_209_
---

# Fix Plan — Iteration 3

## Hypothesis
Every failure in the iteration-2 batch is already fixed at HEAD: the REQ-209 font-metrics UAT was a fixture defect (cap-height checked against the round "C" of "Contact", which overshoots cap height), fixed test-only in a5a337c47c and verified in a real browser by the gate; the change-signal tests and their orphaned ACs pass.

## Analysis
- The subject's failure summary is empty; this iteration exists because the builder filed a `blocked_by: code_frozen` report (REPORT-11353, report-8980b0ef) against batch 0 of the iteration-2 plan (report-b4370a3e). The previous attempt at this plan (REPORT-11354) wrongly stated no blocked_by report was present and was refused by the validator for carrying no ruling. This plan rules on it.
- **REQ-209 font metrics** (`test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved`): the builder marked it `fixed_unverified` only because its own sandbox cannot launch Chromium. The gate has since verified it: scoped quality REPORT-11348 (report-4a44e04e) ran at commit 11e05a2224, which contains a5a337c47c, and reports the test `passed` with 210 passed / 0 failed / **0 skipped** — so the browser launched and the measurement was real, not a skip.
- **AC1054 / AC1817 / AC1818** change-signal tests: pass on re-run (builder, REPORT-11353) and in the gate. AC-1817 and AC-1818 each have a correctly named UAT that passes, so the "orphaned AC" entries are satisfied.
- No hypothesis has repeated 3 times; no stuck test; no BUG-1067 tooling defect; no cross-suite contamination signature (the tests pass in both the batch run and the scoped gate).
- The builder's proposed change is "none" — it asked for no grant. Nothing in scope needs production code.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts — weak-observation — every case marks itself skipped when Chromium cannot launch; a gate that counted skips as passes would accept unmeasured geometry. Keep the gate's skipped count asserted at 0 for this file, or treat a skip as missing evidence.
- tests/test_UAT_FC_BUG-58_invite_modal_fits — inter-test-dependency — depends on built `dist-assets` existing; fails in branch worktrees and passes in the primary checkout (noted in REQ-205). Build the assets in the test's own setup or fail with a named precondition.

## Batches
One batch, verify-only: the six tests of the iteration-2 batch that the builder blocked on, with the REQ-209 browser suite as the dependency set. The builder must make no edits, keep a5a337c47c, and confirm green; a skip of the REQ-209 browser test is to be reported as missing evidence, not a pass.

## Resolution ladder (REQ-938)
Batch 0 — decided at rung 1: REQ-209 requires font metrics measured from the face that actually resolved, and HEAD satisfies it; the earlier failure was the fixture's choice of a round glyph, not the measurement. Rung 2 not needed. Rung 3: the tests stand as fixed in a5a337c47c and pass at the gate (REPORT-11348).

The builder's `code_frozen` blocked_by (REPORT-11353) is **declined**: the rule stands, the work is done within it, and the batch edits no files.
