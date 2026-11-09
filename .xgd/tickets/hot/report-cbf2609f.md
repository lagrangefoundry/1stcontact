---
uid: report-cbf2609f
id: REPORT-11736
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:22:30.013277+00:00'
updated_at: '2026-11-09T07:22:30.013277+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 4
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: The Playwright cache lacks the firefox-1532/webkit-2311 builds the
      pinned playwright-core@1.61.1 launches (only firefox-1538/webkit-2336 exist
      and 1.61.1 is the only Playwright installed), so allEnginesReady is false and
      the AC-688 test skips; installing the pinned builds requires an operator outside
      the sandbox.
    instructions: 'Do not run playwright install (report-d973247a: EPERM on ~/Library/Caches/ms-playwright/__dirlock)
      and do not touch production code, package.json or the lockfile. By read access
      only, check whether firefox-1532 and webkit-2311 now exist in ~/Library/Caches/ms-playwright.
      If both exist, run test_UAT_AC688_no_layout_divergence_across_three_engines
      and report its actual result; only if it then fails on a genuine evidence defect
      in the test itself may you edit tests/reconciliation-l1-substrate.test.ts. If
      they do not exist, edit nothing and report status stuck, reason sandbox_refusal,
      quoting this operator action: run `pnpm --filter @1stcontact/generate exec playwright
      install webkit firefox` from the repo root outside the sandbox, then re-run
      the gate for test_UAT_AC688_.'
    test_scope: test_UAT_AC688_
    ladder:
      rung1: No intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) addresses
        the Playwright pin or browser availability, so rung 1 does not decide.
      rung2: The reference pins playwright ^1.61.1 at tools/generate/package.json:21
        and 1.61.1 is the only Playwright installed, so the pin and code stand and
        code_frozen is not lifted; rung 2 decides.
      rung3: Test and AC-688 stand unchanged; they need the pinned webkit-2311/firefox-1532
        builds installed by an operator outside the sandbox.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2 decided: the reference keeps playwright ^1.61.1 (tools/generate/package.json:21),
        the builder proposed no code change, and the gap is a missing browser install
        outside the sandbox, so the rule stands and the batch works within it, touching
        at most the test file.'
      files:
      - tests/reconciliation-l1-substrate.test.ts
---

# Fix Plan — Iteration 4 (re-plan after validator refusal)

## Hypothesis
AC-688 is orphaned only because the machine's Playwright cache lacks the firefox-1532 / webkit-2311 builds that the pinned playwright-core@1.61.1 launches, so the environment-gated `it.runIf(allEnginesReady)` skips its only test; nothing in the repo is wrong, and the gap closes by an operator installing the pinned browsers outside the sandbox.

## Analysis
- **Why the previous plan was refused.** The prior iteration-4 plan (report-e4b11355) declined the `code_frozen` request with `blocked_by_ruling.files: []`. The validator refused it with: "the `code_frozen` request cannot be declined: blocked_by_ruling.files must list every file the batch edits" (session log, `fix_plan_filter_rejected`, attempt 1). The diagnosis and ruling were right; only the shape was wrong. This plan keeps the ruling and gives the batch a bounded, within-rule file scope: the test file only.
- **The only failure.** AC-688 (story-d0a8cfad) is orphaned. Its single test, `tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines` (lines 536-569), is gated by `allEnginesReady` (lines 530-534) and was skipped in report-37999b07, which ran 54 tests with 0 failed.
- **Root cause, re-verified read-only this iteration.**
  - `~/Library/Caches/ms-playwright` holds `firefox-1538`, `webkit-2336`, and chromium 1228/1234/1243/1248. It has no firefox-1532 or webkit-2311.
  - `node_modules/.pnpm` holds only `playwright@1.61.1` / `playwright-core@1.61.1`, so no installed Playwright can drive the cached builds.
  - `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts:305`) therefore returns false for webkit and firefox. Chromium resolves, so AC-683 passes.
- **History.**
  - Same hypothesis in iterations 1-4: report-06b69e13, report-e7c1a640, report-7526f59b, report-e4b11355.
  - The builder ran the install in report-d973247a and was refused with `EPERM: operation not permitted, mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'`.
  - It then filed blocked_by_handoff report-65619dcd (`code_frozen`, proposed_change: none). The hypothesis is confirmed, not wrong, so per the anti-repetition rule this plan rules on it by the ladder (option b) instead of re-trying the install.
- **Alternatives rejected.**
  - *Bump Playwright to match the cached builds.* No newer Playwright is present locally, so this needs registry network access. It would also move every environment off the version the lockfile pins, to fit one machine's cache.
  - *Install into a sandbox-writable `PLAYWRIGHT_BROWSERS_PATH`.* The gate's own process would not see it unless a session-specific temp path were hard-coded into test config.
  - *Retire AC-688 or align it to the reference (`aligned_to_tip`).* The reference implements three-engine capture (`captureL1` with `engines`), so the AC is not ahead of the reference.
  - *Skip-mark, weaken, or stub the test.* Forbidden, or would be false evidence.
- **Tooling note (not filed).** The AC's own Verification says the test "Runs only when all three engines are installed; skips cleanly otherwise", but the coverage gate counts that sanctioned skip as an orphan. That tension is worth an XGD look. No `xgd report-bug` ID exists for it, so the BUG-1067 path is not used here.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (environmental) — when the gate skips it, the skip reason does not name which engine or build is missing; a diagnosable skip reason would shorten future triage.

## Batches
**Batch 0 (sole batch): AC-688.**
- No production, manifest, or lockfile edits. No browser install attempt: it was already refused by the sandbox.
- The builder confirms by read access only whether `firefox-1532` and `webkit-2311` now exist in `~/Library/Caches/ms-playwright`.
  - If they do, it runs `test_UAT_AC688_` and reports the real result.
  - If they do not, it reports `stuck` / `sandbox_refusal` with the operator action below.
- The test file is the only file the batch may touch, and only if a genuine evidence defect is found in it once the engines are present.

Operator action (outside the sandbox, from the repo root):
`pnpm --filter @1stcontact/generate exec playwright install webkit firefox`, then re-run the gate for `test_UAT_AC688_`.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 2.**
  - Rung 1: no intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) speaks to the Playwright pin or browser availability.
  - Rung 2: the reference keeps `"playwright": "^1.61.1"` (`git show reconcile-src-BUNDLE-43:tools/generate/package.json`, line 21), with 1.61.1 the only version installed. The code and the pin are what the user runs, so `code_frozen` stands.
  - Rung 3: the test and AC-688 stand unchanged.
- **Ruling on blocked_by report-65619dcd (`code_frozen`): declined.** The fix is environmental, the builder proposed no code change, and the batch edits at most the test file.
