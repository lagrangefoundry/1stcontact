---
uid: report-4d4de3ac
id: REPORT-6814
type: report
title: 'Report: fix_plan for story-31204812'
created_by: xgd
created_at: '2026-10-27T23:53:26.300972+00:00'
updated_at: '2026-10-27T23:53:26.300972+00:00'
completed_at: null
last_field_updated: created_at
result: needs_review
fields:
  report_kind: fix_plan
  subject_uid: story-31204812
  items: []
  fix_iteration: 4
  blocking_bug: BUG-1574
---

# Fix Plan — Iteration 4 (terminal: needs_review)

## Hypothesis
The only failure on record (`suite: javascript-vitest`, "executed 0 tests") is an XGD tooling defect (BUG-1574). The `javascript_vitest_open` plugin discards per-test results that vitest did produce. That hides the six real AC2045–AC2050 failures, so the confirmed fix, an `aligned_to_tip` ruling, cannot pass `validate_fix_plan`.

## Analysis
- **Prior history.**
  - Iteration 1 (report-e63d5b68) was an empty plan. The builder then found 6/10 egress tests failing and blocked on `code_frozen` (report-b6bb201d, report-ecdedc3f).
  - Iteration 2 (report-81c6e0fa, then report-51604dd0) ruled `aligned_to_tip` for AC2045–AC2050. `validate_fix_plan` rejected it twice: "no failing test in blocked_by_ruling.tests belongs to `acceptance_criterion-2b82c3cf`: nothing to resolve". The bundle then crashed (bundle-5607a08d `reconcile_error`).
  - This iteration's failure set is unchanged.
- **The "missing generated/" hypothesis (iteration 2) is disproven.** `generated/` is absent, and the egress file still loads and runs: `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts` gives 6 failed / 4 passed in 1.2 s.
- **The results exist but are dropped.**
  - Running the node project with the runner's exact AC filter (`npx vitest run --project node --reporter=json -t "test_UAT_AC2044_|…|test_UAT_AC2053_"`) gives clean, parseable JSON: 2345 total, 6 failed, 4 passed, 2335 pending.
  - REPORT-6806's stdout tail is also well-formed vitest JSON (workers-project files).
  - Yet the plugin recorded `tests: []` and replaced them with a synthetic suite-level failure.
  - The likely cause is non-JSON noise on stdout from the workers project (wrangler/miniflare logging), or a multi-project parse failure. This is unconfirmed because stdout is head-truncated, and the workers project can't start in this sandbox (`listen EPERM 127.0.0.1`).
- **Why no batch is viable.**
  - The substantive diagnosis is confirmed for the third time, now reproduced: AC2045–AC2050 assert REQ-157 intent the code (and the tip) doesn't implement.
  - Under REQ-904 the only permitted resolution is `aligned_to_tip`, since a `code_frozen` grant would invent behaviour the tip lacks. That ruling is mechanically refused while the quality report holds no per-AC failing test.
  - A batch without the ruling would re-block the builder on the same rule; the builder already declined to weaken SSRF assertions without authorisation.
  - A batch aimed at the suite failure would mean fixing XGD's plugin, which is outside this story. The builder also can't reproduce the workers run in its sandbox.
- **BUG-1462 doesn't apply.** The blocker isn't an authorisation decision; the authorisation (`aligned_to_tip`) has already been decided. The blocker is an XGD tooling defect, so BUG-1067 applies: terminal-fail, citing BUG-1574.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals — weak-observation — assert that a known refused subresource appears in `refusals` with its reason, not only that `refusals` is an array.

## Batches
None. This is a terminal failure.

## What is needed to resolve this mechanically
1. **Fix BUG-1574.** The vitest plugin should record per-test results from vitest's JSON (e.g. via a reporter `outputFile`, or by extracting the JSON object from noisy stdout). Alternatively, `validate_fix_plan` should accept ruling tests that the builder's assessment confirmed failing when the quality report holds only a synthetic suite-level failure.
2. **Then re-run reconcile for this story.** The quality report will then list the six AC2045–AC2050 failures, and the iteration-2 ruling in report-51604dd0 can be resubmitted as is, minus its now-disproven `generated/` step. The ruling: `aligned_to_tip` on `code_frozen`. ACs acceptance_criterion-2b82c3cf, -d553d8fb, -7db0225c, -b4af8127, -e4c4d77e and -26d0ac51 are rewritten to the code as landed, with REQ-157 as the cited intent.

**Operator: real security and limit gaps remain in the code**, independent of this failure. Each needs its own fix ticket:
1. A Node redirect hop is not checked, so a capture can be redirected to a private address (server-side request forgery).
2. The 60 s capture limit is never applied.
3. A capture whose guard tripped is still adopted as a reference.
4. A bundle with no `capture.json` breaks `list_references` and `describe_reference`.
