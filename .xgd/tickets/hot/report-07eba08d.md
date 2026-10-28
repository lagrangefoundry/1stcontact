---
uid: report-07eba08d
id: REPORT-6816
type: report
title: 'Report: fix_plan for story-31204812'
created_by: xgd
created_at: '2026-10-28T00:13:57.505341+00:00'
updated_at: '2026-10-28T00:13:57.505341+00:00'
completed_at: null
last_field_updated: created_at
result: needs_review
fields:
  report_kind: fix_plan
  subject_uid: story-31204812
  items: []
  fix_iteration: 5
  blocking_bug: BUG-1574
---

# Fix Plan — Iteration 5 (terminal: needs_review)

## Hypothesis
The only failure recorded is `suite: javascript-vitest` ("executed 0 tests"). It still comes from XGD tooling defect BUG-1574: the `javascript_vitest_open` plugin throws away the per-test results that vitest produced. That hides the six real AC2045–AC2050 failures, so the confirmed `aligned_to_tip` ruling can't pass `validate_fix_plan`.

## Analysis
- **Nothing has changed since iteration 4 (report-4d4de3ac, needs_review, blocking_bug BUG-1574).**
  - The quality report is still REPORT-6806 / report-6734c008 at commit bbe73bd8, with total=0 and `tests: []`.
  - The only files changed since the last iteration are xgd ticket and change-log bookkeeping (`.xgd/_changes/*`, `bundle-5607a08d.md`). No test, AC or production file changed.
  - xgd is the same version (0.17.282).
  - BUG-1574 (ticket://lagrangefoundry/xgd/BUG-1574) is still `draft`, so the defect is unfixed.
- **The diagnosis is settled and confirmed across iterations 2–4.**
  - Running `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts` directly gives 6 failed / 4 passed.
  - AC2045–AC2050 assert REQ-157 SSRF and budget intent that neither the window code nor the xgd-working tip implements.
  - The only resolution REQ-904 allows is `aligned_to_tip` on the builder's `code_frozen` block (report-b6bb201d / report-ecdedc3f). That ruling was written in report-51604dd0.
- **Why there is no batch.**
  - `validate_fix_plan` checks `blocked_by_ruling.tests` against the quality report's failure list. That list holds only the synthetic suite entry, so the ruling is refused with "no failing test … belongs to acceptance_criterion-2b82c3cf". It was refused twice, and the bundle crashed.
  - A batch without the ruling would leave the builder blocked again on `code_frozen`.
  - A batch aimed at the suite failure would mean fixing XGD's plugin, which is out of scope for this story.
  - Re-batching can't change the outcome.
- **Which rule applies.** BUG-1067 does: a stuck reason that cites a filed XGD tooling bug, and one occurrence is enough. BUG-1462 doesn't apply, because the authorisation decision (`aligned_to_tip`) is already made; the blocker is the tooling.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals — weak-observation — assert that a known refused subresource appears in `refusals` with its reason, not only that `refusals` is an array.

## Batches
None. This is a terminal failure.

## What is needed to resolve this mechanically
1. **Fix BUG-1574.** Either:
   - the vitest plugin records per-test results from vitest's JSON (a reporter `outputFile`, or tolerant extraction of the JSON object from noisy multi-project stdout); or
   - `validate_fix_plan` accepts ruling tests that a builder assessment confirmed failing when the quality report holds only a synthetic suite-level failure.
2. **Re-run reconcile for story-31204812.** Then resubmit the report-51604dd0 ruling unchanged, minus its disproven `generated/` step. The ruling is `aligned_to_tip` on `code_frozen`, citing REQ-157, and covers ACs acceptance_criterion-2b82c3cf, -d553d8fb, -7db0225c, -b4af8127, -e4c4d77e and -26d0ac51.

**Operator: real security and budget gaps remain in the code, separate from this failure.** Each needs its own fix ticket:
1. On Node, a redirect hop is not checked, so a capture can be redirected to a private address (SSRF).
2. The 60 s capture limit (MAX_CAPTURE_MS) is never applied.
3. A capture whose guard tripped is still adopted as a reference.
4. A bundle with no `capture.json` breaks `list_references` and `describe_reference`.
