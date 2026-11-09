---
uid: report-ea05921a
id: REPORT-11749
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:44:28.501201+00:00'
updated_at: '2026-11-09T07:44:28.501201+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items: []
  fix_iteration: 9
---

# Fix Plan — Iteration 9

## Hypothesis
AC-688's only test skips, as the AC allows, because the gate host's Playwright cache still lacks firefox-1532 and webkit-2311, the builds playwright-core@1.61.1 needs. XGD's coverage gate counts that allowed skip as "no passing test". This is XGD tooling defect **BUG-1695 (bug-9093c69f)**, plus an operator-only environment action. The story cannot fix either.

## Analysis
- The only failure is AC-688 (orphaned AC). Scoped quality report-37999b07: 54 passed, 0 failed, 1 orphan. Changes since the last iteration are `.xgd` ticket and change-log files only, with no code, test, manifest or lockfile changes.
- Re-checked this iteration: `~/Library/Caches/ms-playwright` holds chromium 1228/1234/1243/1248, ffmpeg 1011/1013, `firefox-1538` and `webkit-2336`. firefox-1532 and webkit-2311 are still absent.
- Looked for a different hypothesis, as the 3-repeat rule requires. The only realistic in-repo route is to resolve a Playwright version whose browsers.json matches the installed firefox-1538/webkit-2336. `node_modules/.pnpm` contains only `playwright@1.61.1` and `playwright-core@1.61.1`, so no matching version is already vendored. Getting one needs a network install plus a lockfile change. Rung 2 has already declined that (the reference pins `^1.61.1` at tools/generate/package.json:21), and the sandbox would block it anyway. No new hypothesis exists.
- Hypothesis history: "the browser builds don't match pinned Playwright 1.61.1, so the operator must install them" has been the diagnosis in iterations 2 through 8. The two latest assessments (report-b6efb28f for iteration 7, report-e1a15631 for iteration 8) are both `status: stuck` and cite **BUG-1695**, with only an operator prescription. Iteration 8's verify-only batch confirmed the cache was unchanged and changed nothing.
- **BUG-1067 rule applied: the test is not re-batched.** A stuck reason citing a filed XGD bug (BUG-1695) is enough on its own, and repeating the verify-only batch would only produce the same stuck result a third time. This plan has **no batches**. BUG-1695 is named here and in the Resolution ladder below so the run's diagnostic report lists it.
- Rejected again: bumping Playwright (declined at rung 2); a skip marker or weaker assertion (forbidden); retiring or rewriting AC-688 (the AC is accurate and already says "skips cleanly otherwise"; the defect is the gate, not the spec).
- No `blocked_by` mode-rule report heads this prompt. The latest builder block is environmental (`blocked_by: environment (BUG-1695) — not a mode rule`), so no mode-rule ruling is needed.

**Operator action to clear it** (repo root, outside the sandbox), then re-run the gate for `test_UAT_AC688_`:
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent environment skip) — when `allEnginesReady` is false, report which engine probe failed and which browser revision was expected, so the gate's orphan report names the missing browser directly.

## Batches
None. The single failing test is left out per the BUG-1067 rule (stuck on XGD defect BUG-1695 plus an operator-only install). Re-batching would repeat iterations 7 and 8 with the same result.

## Resolution ladder (REQ-938)
- AC-688 / test_UAT_AC688_no_layout_divergence_across_three_engines: decided at rung 2, closed out at rung 3.
  - Rung 1: no intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) touches Playwright or browser builds.
  - Rung 2: `reconcile-src-BUNDLE-43:tools/generate/package.json:21` pins `"playwright": "^1.61.1"`, identical to the working tree; no code change is warranted.
  - Rung 3: the test and AC-688 stand unchanged. The orphan is XGD tooling defect **BUG-1695** and clears only when the operator installs firefox-1532 and webkit-2311 outside the sandbox.
