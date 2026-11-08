---
uid: report-9eb72198
id: REPORT-11557
type: report
title: 'Report: fix_plan for report-49607926'
created_by: xgd
created_at: '2026-11-08T19:39:07.602917+00:00'
updated_at: '2026-11-08T19:39:07.602917+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-49607926
  fix_iteration: 8
  items:
  - index: 0
    tests:
    - tests/reconciliation-1c-reset-command.test.ts::AC-2228 — 1c reset, through the
      command surface test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error
    - tests/reconciliation-multi-variate-text-runs.test.ts::AC-2449 capture records
      which text runs share an inline flow test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it
    - tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts::REQ-211 the capture
      records which runs are one flow test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence
    - tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts::REQ-211 the capture
      records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow
    dependency_tests:
    - test_UAT_AC2228_
    - test_UAT_AC2449_
    - test_UAT_FC_REQ_211_
    - test_UAT_AC2464_
    - test_UAT_AC1400_
    - test_UAT_FC_BUG-71_
    hypothesis: 'The four tests hit their time limits rather than failing assertions:
      the suite took 263.7 s against 35-46 s in all eight earlier full runs, which
      is about two back-to-back 120 s REQ-211 capture timeouts. They started right
      after iteration 7''s 74ab8ec30e, the only non-xgd change since the green 280/281
      run, which removed the dist-assets lock from the in-process mirrored `1c assets`
      builds in tests/reconciliation-builder-workspace-import-graph.test.ts, so those
      builds now overlap the Chromium captures and `1c` spawns elsewhere in the suite.'
    instructions: 'These four tests are valid evidence that hit their time limits;
      their assertions are not wrong. REPORT-11556''s vitest suite took 263.7 s against
      35-46 s in the eight earlier full runs of the same tests. That is two sequential
      120 s REQ-211 capture timeouts in one file, plus AC-2449 (120 s) in parallel
      and the AC-2228 port test, which runs three cold `1c` spawns under the 60 s
      default testTimeout. Nothing they exercise changed: the only non-xgd file changed
      since the green 280/281 run (REPORT-11548) is tests/reconciliation-builder-workspace-import-graph.test.ts
      (iteration 7, 74ab8ec30e). That commit took assetsIn''s in-process `run([''assets''])`
      (process.chdir into the mirror, console.log stubbed) out of withDistAssetsLock,
      so the three mirrored builds now overlap the rest of the suite. First, measure:
      run the full node project with that file included, then with it excluded, and
      record the AC-2228 port test''s duration and outcome each time. The AC-2228
      test needs no Chromium, so it reproduces in your sandbox. If excluding the file
      clears the stall, the polluter is that file, and the fix is there: the mirrored
      builds must stop starving or stalling the rest of the suite. Iteration 7''s
      reason for removing the lock (minute-long waits) is contradicted by the 35-46
      s total suite durations, so serialising them again is legitimate, as long as
      their own test timeouts cover the lock wait the way the beforeAll now does (DIST_ASSETS_LOCK_OPTIONS.staleMs
      + 180_000). Keep iteration 7''s TRANSIENT skip and the empty `module-assets.ts`
      output. If excluding the file does not clear the stall, name the measured cause
      in the assessment instead. Do not fix this by raising the four victims'' time
      limits or by changing their assertions; that would hide a stall the suite is
      causing itself. Do not change production code: tools/generate/src/cli/index.ts
      (the --port usage error) and capture/extract.ts (the flow rule) behave as their
      ACs say. Every AC-2464, AC-1400 and BUG-71 test must stay green.'
    test_scope: test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error
      or test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it
      or test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence or test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow
      or test_UAT_AC2228_ or test_UAT_AC2449_ or test_UAT_FC_REQ_211_ or test_UAT_AC2464_
      or test_UAT_AC1400_ or test_UAT_FC_BUG-71_
    ladder:
      rung1: REQ-211/AC-2449 require that a capture record a sentence's runs as one
        flow and that a <br> or a blockified child end it, and AC-2228 requires that
        a bad --port be a usage error; no intent in scope concerns how suites share
        load or locks.
      rung2: At reconcile-src-BUNDLE-41, capture/extract.ts:3112 records a flow only
        when it has more than one run and cli/index.ts:1815 throws '--port must be
        a port number', so the reference agrees with the tests.
      rung3: 'Decided here: the tests and ACs stand, production is unchanged, and
        the fix belongs to the test harness whose iteration-7 change began the cross-suite
        stall.'
---

# Fix Plan — Iteration 8

## Hypothesis
The four new failures are tests that ran out of time, not tests whose assertions failed. They started right after iteration 7's commit 74ab8ec30e, which changed only `tests/reconciliation-builder-workspace-import-graph.test.ts`. That commit took the mirrored in-process `1c assets` builds out of the dist-assets lock, so they now run alongside the rest of the suite, and the tests most sensitive to load and child processes (three Chromium captures and one test that spawns `1c` three times) now stall to their time limits.

## Analysis
- **What failed.** REPORT-11556 (commit 17b7fab9ff) has 4 failures and 1 orphan:
  - AC-2228 `a_port_that_is_not_a_positive_number_is_a_usage_error`
  - AC-2449 `runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it`
  - REQ-211 `an_inline_element_stays_in_its_sentence`
  - REQ-211 `a_break_and_a_blockified_child_end_a_flow`
  - The orphan is AC-2449 itself. It is orphaned only because its single test failed, so it clears when that test passes. No AC needs to change.

  Every failure entry is synthesised ("JUnit XML missing"), so no traceback exists.
- **They are timeouts.** The vitest suite took 263.7 s. The eight earlier full scoped runs of the same 274–281 tests took 35–46 s (REPORT-11506, 11511, 11521, 11528, 11531, 11537, 11548). The two REQ-211 capture tests run one after the other in one file, each with a 120 s limit (`tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts:259,286`). 2 × 120 s plus about 20 s of everything else is about 263 s. AC-2449 (`tests/reconciliation-multi-variate-text-runs.test.ts:340`, 120 s) runs in parallel with them. The AC-2228 port test spawns the real `1c` three times in a row (`tests/reconciliation-1c-reset-command.test.ts:191-198`) under the 60 s default `testTimeout` (`vitest.node.config.mts:77`). It is the only test in its file that spawns three times, which makes it that file's most time-exposed test.
- **The code and the tests did not change.**
  - `git log -15` shows `tests/reconciliation-builder-workspace-import-graph.test.ts` as the only non-xgd file changed between the 280/281 run (REPORT-11548, 18:50) and this one.
  - The `--port must be a port number` error is the same at HEAD (`tools/generate/src/cli/index.ts:754`) and at the reference (`index.ts:1815`).
  - The capture's flow rule is `extract.ts:3112` at the reference (`inFlow = flowGroup && flowGroup.length > 1`), which is what the tests assert.
  - The REQ-211 tests and AC-2449 passed in every gate run since iteration 1's test fix 3ef55bf62c.
- **History.** This subject has never seen these four fail together, and this hypothesis has not been proposed before.
  - Iterations 1–2 fixed REQ-211 `a_break…` for a real reason: a wrong expectation about the `<br>` case. That fix is still in place and still correct.
  - Iterations 3–7 dealt with AC-1400 and AC-2464 lock and harness issues.
  - **Iteration 7's premise is now doubtful.** It assumed the mirrored builds waited "minutes" for the lock. The 35–46 s total suite durations of those runs rule that out. The parts of iteration 7 that are plausibly real fixes are skipping `dist-assets.staging/.retired` and not copying `module-assets.ts`. Removing the lock is the only part that changes how the file overlaps with others.
- **Isolation.** This is the first occurrence, so there isn't enough history to tell contamination from flakiness. Per the rules, the builder attempts a fix based on a measured polluter rather than deleting anything. The builder's sandbox cannot launch Chromium (REPORT-11508, 11518), but the AC-2228 test needs only `spawn`, so the builder can reproduce the stall with that test.
- **Builder blocks.** The latest assessment, REPORT-11553 (report-eaa944f6), is `fixed`, with no `blocked_by`. There is nothing to rule on.

## Spec Changes Made
None. AC-2449's text already says what the code does. Its orphan status is a side effect of the failing test.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-1c-reset-command.test.ts::AC-2228 — 1c reset, through the command surface test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error` — inter-test-dependency (load-sensitive) — three cold `1c` spawns in a row share one 60 s budget. Run the three bad values concurrently, or one spawn per case, so the test measures validation and not machine load.
- `tests/reconciliation-multi-variate-text-runs.test.ts::AC-2449 … test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it` and `tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts::REQ-211 the capture records which runs are one flow *` — duplicate / infra-reuse-gap — three tests launch Chromium separately to capture the same `req211-inline-runs.html` and assert the same facts. Capture once per file, in `beforeAll`, and keep one UAT per AC claim.

## Batches
**Batch 0 (one batch).**
- **Contents:** the four time-limited tests, plus every AC-2228, AC-2449, REQ-211 and AC-2464 test as blast radius, plus AC-1400 and BUG-71, which share the dist-assets lock.
- **Why one batch:** the suspected polluter (the import-graph harness) and the victims have to be validated in the same run. Splitting them would hide the interaction.
- **Instructions in short:** measure first, then fix the polluter, never the victims' time limits.

## Resolution ladder (REQ-938)
- **Batch 0: decided at rung 3.**
  - Rung 1: REQ-211 / AC-2449 require that a capture record a sentence's runs as one flow and that a `<br>` or a blockified child end it. AC-2228 requires that a non-positive or non-numeric `--port` be a usage error. No intent in scope concerns how suites share load or locks.
  - Rung 2: the reference implements both. For flows, `extract.ts:3112` at `reconcile-src-BUNDLE-41` records a flow only when it has more than one run. For the port, `index.ts:1815` at the same ref throws the usage error. So the reference agrees with the tests.
  - Rung 3: the tests and ACs stand, no production code changes, and the fix belongs to the test harness that started the stall.
