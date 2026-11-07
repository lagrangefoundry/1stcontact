---
uid: report-45aa3e09
id: REPORT-11191
type: report
title: 'Report: fix_plan for report-05835b4c'
created_by: xgd
created_at: '2026-11-07T22:41:21.707374+00:00'
updated_at: '2026-11-07T22:41:21.707374+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-05835b4c
  items:
  - index: 0
    tests:
    - test_UAT_AC2132_
    - test_UAT_AC2133_
    - test_UAT_AC2134_
    - test_UAT_AC2135_
    - test_UAT_AC2136_
    - test_UAT_AC2137_
    - test_UAT_AC2138_
    - test_UAT_AC2139_
    - test_UAT_AC2140_
    - test_UAT_AC2141_
    - test_UAT_AC2142_
    - test_UAT_AC2203_
    - test_UAT_AC2204_
    - test_UAT_AC2205_
    - test_UAT_AC2206_
    - test_UAT_AC2207_
    - test_UAT_AC2208_
    - test_UAT_AC2209_
    - test_UAT_AC2210_
    - test_UAT_AC2211_
    - test_UAT_AC2333_
    - test_UAT_AC2334_
    - test_UAT_AC2335_
    - test_UAT_AC2356_
    - test_UAT_AC2357_
    dependency_tests:
    - test_UAT_FC_REQ-199_
    - test_UAT_FC_REQ-203_
    - test_UAT_FC_BUG-62_
    - test_UAT_FC_BUG-57_
    - test_UAT_FC_REQ-200_
    hypothesis: 'No failing evidence remains: the stale fixtures and missing AC tokens
      from iteration 1 were fixed and scoped quality REPORT-11185 passed 204/204,
      so this batch only keeps the scope green.'
    instructions: Nothing is failing. Re-run the scope and confirm it stays green;
      make no production or test edits unless something in scope regresses, and if
      it does, report the regression rather than widening the batch. Leave AC-2208
      (aligned_to_tip, iteration 1) and AC-2137 (amended per REQ-203) as they are.
    test_scope: test_UAT_AC2132_ or test_UAT_AC2133_ or test_UAT_AC2134_ or test_UAT_AC2135_
      or test_UAT_AC2136_ or test_UAT_AC2137_ or test_UAT_AC2138_ or test_UAT_AC2139_
      or test_UAT_AC2140_ or test_UAT_AC2141_ or test_UAT_AC2142_ or test_UAT_AC2203_
      or test_UAT_AC2204_ or test_UAT_AC2205_ or test_UAT_AC2206_ or test_UAT_AC2207_
      or test_UAT_AC2208_ or test_UAT_AC2209_ or test_UAT_AC2210_ or test_UAT_AC2211_
      or test_UAT_AC2333_ or test_UAT_AC2334_ or test_UAT_AC2335_ or test_UAT_AC2356_
      or test_UAT_AC2357_ or test_UAT_FC_REQ-199_ or test_UAT_FC_REQ-203_ or test_UAT_FC_BUG-62_
      or test_UAT_FC_BUG-57_ or test_UAT_FC_REQ-200_
    ladder:
      rung1: 'The intents in scope conflict with no current test: REQ-203 orders the
        AC-2137 amendment and the bundle REQ-201 section 12 sentence supports the
        AC-2208 alignment.'
      rung2: The reference state reconcile-src-BUNDLE-38 matches what the green tests
        assert; no discrepancy is open.
      rung3: 'Decided here: the tests stand and all pass, so no code change is demanded.'
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 3 decides: REPORT-11190 reports blocked_by null with no proposed
        change and every test in scope passes (REPORT-11185, 204/204), so code_frozen
        stands and no edit within it is needed.'
      files: []
  fix_iteration: 4
---

# Fix Plan — Iteration 4

## Hypothesis
There is no failing evidence left: the stale-fixture and missing-AC-token gap diagnosed in iteration 1 (report-3cee3bab) was closed by the prior batch, and the scoped quality run REPORT-11185 (report-dbd124da) passed 204 tests with 0 failures, lint and build clean.

## Analysis
- Failure set for this iteration is empty (0 failures, no error signatures, no capability mapping).
- Changed files since the last iteration are ticket-store records only (`.xgd/_changes/*`, report-7a881ea5, report-a8055334); no test or production file moved, so no regression can have been introduced.
- The latest builder record, REPORT-11190 (report-7a881ea5, `blocked_by_handoff`, rule `code_frozen`), carries `blocked_by: null` and no proposed change: the builder made no edits because none were needed. That means no production change was requested, so nothing could be granted. The ruling below is **declined**: `code_frozen` stands and no edit is required within it.
- Two decisions from earlier iterations stand and are recorded here so a review can see them:
  - AC-2208 was aligned to the reference state (`aligned_to_tip`, iteration 1). No backfill migration exists because the database was wiped and rebaselined, per the bundle.
  - AC-2137 was amended (builder, prior pass) so that accepting at `/terms` itself goes to the builder root. That is REQ-203's stated behaviour ("From that one path the accept control goes to the builder root instead"), so rung 1 supports the amendment.
- Isolation: the earlier whole-scope run crashed with exit 137, which looks like the run itself running out of memory rather than a test problem. Since then both the per-file runs and the scoped quality run (204 tests) are green. No test fails alone or only in the full suite, so there is no contamination to chase.
- Process gap (not a test failure): the AC-2208 and AC-2137 ticket updates were auto-committed without a `--commit-message` narrative. It can't be repaired without rewriting history and does not affect evidence.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- iteration-1 plan `dependency_tests` used `test_UAT_FC_REQ_200_` (underscore). The REQ-200 tests are named `test_UAT_FC_REQ-200_*`, so that selector matched nothing; this plan uses the hyphenated prefix — infra-reuse-gap — keep selectors matching the actual test-name prefix.
- tests/test_UAT_FC_REQ-201_library_live.test.ts and tests/test_UAT_FC_REQ-201_material_changes.workers.test.ts — weak-observation (traceability) — REQ-201 behaviours (400 on a bad cursor, no-feed degradation, close-on-clear, reset re-arm) are proven only by FC-named tests. If STORY-144's ACs for them lack `test_UAT_AC<N>_` tokens they will surface as orphaned ACs later; add AC-token aliases when next in the file.

## Batches
One keep-green batch: the full set from iteration 1 plus its dependency suites, with no fix work. Its purpose is to keep this scope green at validation and to carry the ruling on REPORT-11190. Splitting is pointless with zero failures.

## Resolution ladder (REQ-938)
- Batch 0 — decided at rung 3 (nothing to decide).
  - Rung 1: the intents in scope (REQ-199/200/201/202/203, BUG-57/62) conflict with no current test. REQ-203 orders the AC-2137 amendment, and the bundle's REQ-201 §12 sentence supports the AC-2208 alignment.
  - Rung 2: the reference state `reconcile-src-BUNDLE-38` is what the green tests already describe. No discrepancy is open.
  - Rung 3: the tests stand as they are and all pass; no code change is demanded.
