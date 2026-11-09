---
uid: report-e67249b4
id: REPORT-11745
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:39:30.724059+00:00'
updated_at: '2026-11-09T07:39:30.724059+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 8
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: 'Unchanged since iteration 7: AC-688 is orphaned because the XGD coverage
      gate counts the AC-sanctioned environment skip (firefox-1532/webkit-2311 absent
      for Playwright 1.61.1) as no passing test; XGD tooling defect BUG-1695, not
      re-batched for a fix per BUG-1067'
    instructions: Verify-only; make no edits to tests, ACs, stories, manifests or
      production code. Check whether ~/Library/Caches/ms-playwright now contains firefox-1532
      and webkit-2311 (as of this plan it holds only firefox-1538 and webkit-2336).
      If both are present, run test_UAT_AC688_no_layout_divergence_across_three_engines
      and report its real result. If not, report status=stuck citing BUG-1695 and
      the operator action `pnpm --filter @1stcontact/generate exec playwright install
      webkit firefox`; do not retry the install (sandbox EPERM on __dirlock) and do
      not request a Playwright bump.
    test_scope: test_UAT_AC688_
    ladder:
      rung1: Intents in scope (REQ-219/220/221/222, BUG-78) do not address Playwright
        or browser builds, so rung 1 is silent.
      rung2: 'Decided here: reconcile-src-BUNDLE-43:tools/generate/package.json:21
        pins playwright ^1.61.1, identical to the working tree, so the code freeze
        stands and no version bump is warranted.'
      rung3: Test and AC-688 stand unchanged; the orphan is XGD tooling defect BUG-1695
        (gate treats an AC-sanctioned environment skip as orphaned) and clears only
        when the operator installs firefox-1532/webkit-2311 outside the sandbox.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2 decides: the reference pins playwright ^1.61.1 at tools/generate/package.json:21
        and no intent in scope moves it; the latest builder block is environmental
        (BUG-1695), so the batch makes no production edit.'
      files:
      - tests/reconciliation-l1-substrate.test.ts
---

# Fix Plan — Iteration 8

## Hypothesis
Nothing has changed since iteration 7. AC-688 is orphaned because XGD's coverage gate counts the environment skip that AC-688 itself allows ("Runs only when all three engines are installed; skips cleanly otherwise") as "no passing test". The skip happens because the gate host's Playwright cache lacks firefox-1532 and webkit-2311, the builds Playwright 1.61.1 requires. This is XGD tooling defect **BUG-1695 (bug-9093c69f)** and the story cannot fix it.

## Analysis
- The only failure is AC-688 (orphaned AC). Scoped quality report-37999b07 shows 54 passed, 0 failed and 1 orphan. The changed files since the last iteration are only `.xgd` ticket and change-log files, with no code, test or manifest changes.
- Re-checked this iteration: `~/Library/Caches/ms-playwright` holds `firefox-1538`, `webkit-2336` and chromium 1228/1234/1243/1248. The builds Playwright 1.61.1 needs (firefox-1532, webkit-2311) are still absent. So the test still skips.
- In the latest assessment (REPORT-11742 / report-b6efb28f, iteration 7 batch 0), the builder reported `status: stuck` with `blocked_by: environment (BUG-1695) — not a mode rule`. Its prescription was an operator action only: `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`, run outside the sandbox. The builder can't do it: in iteration 3 the sandbox refused the install with EPERM on `~/Library/Caches/ms-playwright/__dirlock`, and browsers can't launch inside the sandbox anyway.
- Hypothesis history: "the browser builds don't match the pinned Playwright, so the operator must install them" has been the diagnosis in iterations 2 through 7. Under the BUG-1067 rule, a stuck test whose reason cites an XGD bug filed with `xgd report-bug` (BUG-1695) is **not re-batched for a fix**. The single batch below only checks whether the operator has installed the browsers, and it records BUG-1695 in `ladder.rung3`. It has no fix instructions and no hypothesis that the builder can act on.
- Options considered and rejected: bumping Playwright (the code freeze stands at rung 2, because the reference pins `^1.61.1` at tools/generate/package.json:21); skip-marking or weakening the test (forbidden); retiring or rewriting AC-688 (the AC is accurate and already allows the skip, and the defect is in the gate, not the spec).

**Operator action to clear it**: run this from the repo root outside the sandbox, then re-run the gate for `test_UAT_AC688_`:
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (skip diagnostics) — when it skips, the skip doesn't say which engine failed to launch or which build was expected. Logging that would make the gate report point straight at the missing browser.

## Batches
- **Batch 0 (verify-only, test_UAT_AC688_)**: no edits. The builder checks whether firefox-1532 and webkit-2311 are now present in the Playwright cache. If both are, it runs the test and reports the real result. Otherwise it reports stuck, citing BUG-1695 and the operator command above. It does not retry the install, and it does not ask again for a Playwright bump.

## Resolution ladder (REQ-938)
- Batch 0: decided at rung 2. Rung 1 is silent, because none of the intents in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) touch Playwright or browser builds. At rung 2, `reconcile-src-BUNDLE-43:tools/generate/package.json:21` pins `"playwright": "^1.61.1"`, the same as the working tree, so the code stays as it is. At rung 3, the test and AC-688 stand unchanged, and the remaining orphan is XGD tooling defect BUG-1695.
