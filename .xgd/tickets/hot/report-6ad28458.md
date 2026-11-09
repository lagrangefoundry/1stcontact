---
uid: report-6ad28458
id: REPORT-11771
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T08:46:47.292552+00:00'
updated_at: '2026-11-09T08:54:20.262264+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 15
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: 'AC-688 is unclosable inside this run: its test skips by design because
      webkit-2311/firefox-1532 are absent from the machine Playwright cache, installing
      them needs network plus a sandbox-refused write (EPERM), and the coverage gate
      miscounts the sanctioned skip as an orphan (BUG-1696).'
    instructions: 'Make no edits. This batch only keeps the chromium-only sibling
      AC-683 green in the gate run; a local skip in your sandbox is expected. AC-688
      is deliberately excluded (BUG-1067 rule): do not attempt the browser install,
      do not change the Playwright dependency or lockfile, do not touch engineAvailable,
      and do not rewrite the AC-688 test or AC.'
    test_scope: test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    ladder:
      rung1: No intent in scope (REQ-222/221/219/220, BUG-78) touches Playwright,
        browser availability or the AC-688 engine precondition, so rung 1 does not
        decide.
      rung2: 'Decided here: reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21,
        identical to the working tree, and keeps the same AC-688 skip precondition,
        so the code stays.'
      rung3: 'Tests stand; AC-688 is blocked by the sandbox (operator, outside sandbox:
        pnpm --filter @1stcontact/generate exec playwright install webkit firefox)
        and by XGD tooling defect BUG-1696, so it is not re-batched.'
  batches_pending: false
---

# Fix Plan — Iteration 15

## Hypothesis
AC-688 cannot be closed by any step inside this run. Its three-engine test is correct and skips by design because the machine's Playwright cache lacks webkit-2311 and firefox-1532. Installing them needs network access and a write to `~/Library/Caches/ms-playwright`, which the sandbox refuses (EPERM, report-d973247a). The coverage gate then counts that skip, which the AC allows, as an orphan (XGD tooling defect BUG-1696).

## Analysis
- Parent quality report report-1581c845 (commit 02fac4b5): 54 tests, 0 failed, lint, build and preflight clean. The only failure is "AC-688 (orphaned acceptance criterion)".
- Since iteration 14 only `.xgd/_changes/*` and the quality report changed. No product, test, dependency or browser-cache change happened, so the result is identical to iterations 12-14.
- History for story-d0a8cfad (checked by subject uid):
  - Iterations 1-11 batched `test_UAT_AC688_no_layout_divergence_across_three_engines` (tests/reconciliation-l1-substrate.test.ts). The builder made no edits each time. Its `blocked_by: code_frozen` request (report-dacf5f5d) was declined on rung 2, because reconcile-src-BUNDLE-43 pins `"playwright": "^1.61.1"` at tools/generate/package.json:21, the same as the working tree.
  - The builder's install attempt (report-d973247a) failed with `EPERM: mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'`.
  - Iterations 12-14 left AC-688 out of the batches under the BUG-1067 rule and recorded BUG-1696. The latest assessment (report-74ebb738) is `no_change_needed` for the keep-green AC-683 batch.
- "Install the pinned browsers" has been tried more than 3 times. It is not tried again. Under the BUG-1067 rule, AC-688 is **not re-batched**: the fix lies outside this story's scope, either in the operator's environment or in XGD's coverage gate (BUG-1696).
- Other options looked at and rejected again:
  - Bumping or re-resolving Playwright to match the cache: rung 2 forbids it, because the reference pins the same range and lock.
  - Rewriting or retiring AC-688 (aligned_to_tip): this is not justified. The reference state has the same test and the same skip precondition, and the AC itself says the test skips when the engines are missing. The AC and test agree with the reference. Only the gate's counting is wrong.
- **Operator action, outside the sandbox:** `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`. After that, AC-688's test runs and the orphan clears with no repo change.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent skip) — when it skips, record which engine failed to launch and why (the missing revision), so the gate report names the missing browser directly.

## Batches
- **Batch 0 (keep-green only):** `test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths`, the Chromium-only sibling of AC-688 on the same capture harness. No edits are expected. It exists so the validation gate re-confirms AC-683 and carries the ladder record, including BUG-1696, for the diagnostic report. AC-688 is deliberately excluded.

## Resolution ladder (REQ-938)
- Batch 0:
  - **Rung 1 does not decide:** no intent in scope (REQ-222/221/219/220, BUG-78) touches Playwright, browser availability or the AC-688 engine precondition.
  - **Rung 2 decides the code stays:** reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21 and keeps the same AC-688 skip precondition.
  - **Rung 3 — the tests stand:** AC-688 is blocked by the sandbox (needs the operator install above) and by XGD tooling defect BUG-1696, so it is not re-batched.