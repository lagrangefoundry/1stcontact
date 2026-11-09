---
uid: report-bdd2e281
id: REPORT-11740
type: report
title: 'Report: blocked_by_handoff for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:32:53.537930+00:00'
updated_at: '2026-11-09T07:32:53.537930+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-d0a8cfad
  rule: code_frozen
  evidence: |-
    I left every file unchanged: the WebKit and Firefox builds this test needs are not installed, so I'm reporting this batch as stuck.

    **What I checked (read-only):**
    - **Required builds:** the repo's Playwright (`playwright-core@1.61.1`) pins `firefox` to revision **1532** and `webkit` to revision **2311**, according to `node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/browsers.json`.
    - **Installed builds:** `~/Library/Caches/ms-playwright` has `firefox-1538` and `webkit-2336`. Those belong to a different Playwright version, so this one can't use them. The four Chromium builds (`chromium-1228` through `chromium-1248`) include 1228, the one it pins.
    - **Effect on the test:** `test_UAT_AC688_no_layout_divergence_across_three_engines` only runs when all three engines are available (`it.runIf(allEnginesReady)`, `tests/reconciliation-l1-substrate.test.ts:530-534`). With WebKit and Firefox unavailable it never runs, so its result says nothing about the code or the test's evidence. I did not run it, and there is nothing in the test to fix.

    **Operator action needed:** from the repo root, outside the sandbox, run

    ```
    pnpm --filter @1stcontact/generate exec playwright install webkit firefox
    ```

    then re-run the gate for `test_UAT_AC688_`. I didn't run the install because it fails with EPERM inside the sandbox (report-d973247a) and the planner said not to.

    ```yaml
    ## Assessment
    status: stuck
    reason: sandbox_refusal
    evidence: "playwright-core@1.61.1 browsers.json requires firefox revision 1532 and webkit revision 2311; ~/Library/Caches/ms-playwright contains only firefox-1538 and webkit-2336 (chromium-1228 present). The test is gated by it.runIf(allEnginesReady), so it cannot run until those exact revisions are installed. Installing from the sandbox fails with EPERM on ~/Library/Caches/ms-playwright/__dirlock (report-d973247a)."
    operator_action: "run `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` from the repo root outside the sandbox, then re-run the gate for test_UAT_AC688_."
    files_changed: []
    ```
  proposed_change: '(none stated: the builder made no edits and gave no verdict; see
    evidence)'
  batch_index: 0
  parent_report_uid: report-52d07d12
  anchor_ticket: bundle-0881342c
---

# Builder blocked by `code_frozen`

**Evidence**: I left every file unchanged: the WebKit and Firefox builds this test needs are not installed, so I'm reporting this batch as stuck.

**What I checked (read-only):**
- **Required builds:** the repo's Playwright (`playwright-core@1.61.1`) pins `firefox` to revision **1532** and `webkit` to revision **2311**, according to `node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/browsers.json`.
- **Installed builds:** `~/Library/Caches/ms-playwright` has `firefox-1538` and `webkit-2336`. Those belong to a different Playwright version, so this one can't use them. The four Chromium builds (`chromium-1228` through `chromium-1248`) include 1228, the one it pins.
- **Effect on the test:** `test_UAT_AC688_no_layout_divergence_across_three_engines` only runs when all three engines are available (`it.runIf(allEnginesReady)`, `tests/reconciliation-l1-substrate.test.ts:530-534`). With WebKit and Firefox unavailable it never runs, so its result says nothing about the code or the test's evidence. I did not run it, and there is nothing in the test to fix.

**Operator action needed:** from the repo root, outside the sandbox, run

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

then re-run the gate for `test_UAT_AC688_`. I didn't run the install because it fails with EPERM inside the sandbox (report-d973247a) and the planner said not to.

```yaml
## Assessment
status: stuck
reason: sandbox_refusal
evidence: "playwright-core@1.61.1 browsers.json requires firefox revision 1532 and webkit revision 2311; ~/Library/Caches/ms-playwright contains only firefox-1538 and webkit-2336 (chromium-1228 present). The test is gated by it.runIf(allEnginesReady), so it cannot run until those exact revisions are installed. Installing from the sandbox fails with EPERM on ~/Library/Caches/ms-playwright/__dirlock (report-d973247a)."
operator_action: "run `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` from the repo root outside the sandbox, then re-run the gate for test_UAT_AC688_."
files_changed: []
```

**Proposed change**: (none stated: the builder made no edits and gave no verdict; see evidence)
