---
uid: report-e4b11355
id: REPORT-11735
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:12:29.626090+00:00'
updated_at: '2026-11-09T07:12:29.626090+00:00'
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
    hypothesis: The sandbox denies writes to ~/Library/Caches/ms-playwright (EPERM
      on __dirlock), so the webkit-2311/firefox-1532 builds pinned by playwright-core@1.61.1
      cannot be installed from inside the run; no in-repo change within the story
      constraints can close AC-688.
    instructions: 'Do not run the browser install again: report-d973247a showed the
      sandbox refuses it with EPERM on ~/Library/Caches/ms-playwright/__dirlock. Edit
      no file. Confirm, by read access only, whether webkit-2311 and firefox-1532
      are now in the Playwright cache. If they are, run test_UAT_AC688_no_layout_divergence_across_three_engines
      and report the actual result. If they are not, report stuck with reason sandbox_refusal,
      quoting this operator action exactly: run `pnpm --filter @1stcontact/generate
      exec playwright install webkit firefox` outside the sandbox from the repo root,
      then re-run the gate for test_UAT_AC688_.'
    test_scope: test_UAT_AC688_
    ladder:
      rung1: No intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) addresses
        the Playwright pin or browser availability, so rung 1 does not decide.
      rung2: The reference pins playwright ^1.61.1 at tools/generate/package.json:21,
        the same as the working tree, so the dependency stays and code_frozen stands.
      rung3: The test and AC-688 stand unchanged; they need the pinned webkit/firefox
        builds installed by an operator outside the sandbox, not a code change.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2 decided: the reference keeps playwright ^1.61.1 (tools/generate/package.json:21),
        so bumping the dependency to fit one machine stale browser cache contradicts
        the pin; the gap closes by installing the pinned browsers outside the sandbox,
        which edits no repo file.'
      files: []
---

# Fix Plan — Iteration 4

## Hypothesis
AC-688 stays orphaned because the sandbox does not let anyone in this run write to the machine's Playwright browser cache (`~/Library/Caches/ms-playwright`, EPERM on `__dirlock`). Without that write, the firefox-1532 and webkit-2311 builds that the pinned playwright-core@1.61.1 needs cannot be installed. No in-repo edit allowed by the story's constraints can close the gap. It needs an operator action outside the sandbox.

## Analysis
- **The only failure is the orphaned AC-688.** Its single test, `tests/reconciliation-l1-substrate.test.ts:536-569` (`test_UAT_AC688_no_layout_divergence_across_three_engines`), is gated by `it.runIf(allEnginesReady)` at lines 530-534. It was skipped in report-37999b07, which ran 54 tests with 0 failures.
- **The cause has been the same at every step.** report-dacf5f5d diagnosed it: playwright-core@1.61.1 wants firefox-1532 and webkit-2311, but the cache holds firefox-1538 and webkit-2336, so `engineAvailable` returns false for webkit and firefox. Chromium matches, which is why AC-683 passes.
- **The previous plans asked for the browser install twice** (report-e7c1a640, then report-7526f59b after a validator refusal). The builder ran it in report-d973247a: `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` returned `Error: EPERM: operation not permitted, mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'`, and the builder reported `status: stuck`, `reason: sandbox_refusal`. A third request would fail the same way, so this plan does not repeat it.
- **Alternatives considered and rejected:**
  - *Install the browsers into a sandbox-writable folder through `PLAYWRIGHT_BROWSERS_PATH`.* The validation gate starts its own process and would not inherit that variable. Making it inherit would mean hard-coding a temp-folder path in test or vitest config, which ties the suite to one machine and session.
  - *Bump Playwright, and the lockfile, to match the browsers already in the cache.* That needs a `code_frozen` override. Rung 2 decides against it: the reference pins `"playwright": "^1.61.1"` (`tools/generate/package.json:21` at `reconcile-src-BUNDLE-43`, the same as the working tree), and changing the dependency to fit one machine's stale cache would move every other environment off the pinned browsers. Resolving a new version would also write to the pnpm store outside the sandbox.
  - *Rewrite the test to run without the engines, or add a skip marker.* Either would be false evidence or is forbidden.
  - *Retire AC-688 or align it to the reference (`aligned_to_tip`).* The reference implements the behaviour (`captureL1` running across engines). The AC is accurate, and its verification text already allows a clean skip. Nothing at the reference contradicts it.
- **This is not the BUG-1067 path.** The builder cited no `xgd report-bug` ID. The block is the sandbox boundary on a machine-level cache, not a defect in XGD's coverage tooling. One tension is worth a note for the operator: the AC allows a clean skip, but the coverage gate counts a skip as "no passing test". That is how the gate is meant to work, so it is not a tooling defect.
- **Outcome:** the test stands (rung 3) and needs no code change. The batch is planned so the builder confirms the block in one step and stops, instead of repeating the install. The run's diagnostic report should carry the operator action below.

**Operator action, outside the sandbox, from the repo root:** `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`. Then re-run the gate for `test_UAT_AC688_`.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (the skip is silent) — when `allEnginesReady` is false, report which engine probe failed. The builder declined this as cosmetic because of BUG-1637 skip-wording risk; it stays a flag only and is not directed.

## Batches
- **Batch 0** (AC-688 only, scope `test_UAT_AC688_`). This is a dead-end confirmation, not another fix attempt. The builder does not run the browser install again and edits no file. It confirms that webkit-2311 and firefox-1532 are still missing from the Playwright cache, for example by listing `~/Library/Caches/ms-playwright`, which only needs read access. If they are now present, it runs the test and reports the result. If not, it reports `stuck` with `reason: sandbox_refusal` and the operator action above, quoted exactly.

## Resolution ladder (REQ-938)
- **Batch 0: rung 2 settles the dependency question, and rung 3 decides the test.**
  - Rung 1: none of the intents in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) addresses the Playwright pin or browser availability.
  - Rung 2: the reference pins `playwright ^1.61.1` (`tools/generate/package.json:21`), the same as the working tree, so `code_frozen` stands and the dependency stays.
  - Rung 3: the test and AC-688 stand unchanged. They need an environment with the pinned browsers, which only an operator outside the sandbox can provide.
