---
uid: report-dacf5f5d
id: REPORT-11728
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T06:43:22.718913+00:00'
updated_at: '2026-11-09T06:43:22.718913+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-d0a8cfad
  parent_report_uid: report-06b69e13
  batch_index: '0'
---

I made no edits. AC-688 can't be fixed with a test or ticket change: the gate environment can't launch webkit or firefox, so its only test can never pass there.

**What's happening**
- `test_UAT_AC688_no_layout_divergence_across_three_engines` (`tests/reconciliation-l1-substrate.test.ts:536-569`) runs only when chromium, webkit and firefox all launch. If one doesn't, it is skipped, which the AC itself allows. In the last quality run (report-37999b07) it came back `skipped`, so the coverage check counts AC-688 as having no passing test.
- Chromium launches fine: AC-683, which needs only chromium, passed in that run.
- The other two don't because the installed browsers don't match what Playwright expects. `tools/generate` uses Playwright 1.61.1, which wants firefox revision 1532 and webkit revision 2311. The cache at `~/Library/Caches/ms-playwright` has `firefox-1538` and `webkit-2336`, from some other Playwright version. So the launch in `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts:305`) fails and returns false.

**Why I didn't change anything**
- The test and the AC are correct. It's a real cross-engine check, and the AC already says it runs only when all three engines are present.
- Adding a skip marker is forbidden, and the gate strips skips anyway.
- Rewriting the test to pass without engines would be a test that proves nothing.
- Deprecating the AC would be wrong, because the behaviour is real.
- Changing the Playwright version or the probe is frozen code in this mode. Installing browsers needs network access and writes outside this sandbox.

**To fix**, run from a terminal: `pnpm --filter ./tools/generate exec playwright install webkit firefox`. That installs firefox-1532 and webkit-2311, and the next gate run should then run the test instead of skipping it. The alternative is to bump Playwright in `tools/generate/package.json` to the version that matches the installed browsers. That counts as a code change, so it needs an exception that lifts `code_frozen`.

I couldn't read `MODE-RULES.md` (permission denied), so none of the tagged rules may fit exactly. `code_frozen` is the closest, since the only in-repo fix is the Playwright bump.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "test_UAT_AC688_no_layout_divergence_across_three_engines (tests/reconciliation-l1-substrate.test.ts:536) is skipped through it.runIf(allEnginesReady): report-37999b07 records status 'skipped' and the AC Coverage suite reports 'AC-688 ... has no passing test'. engineAvailable (tools/generate/src/cli/capture/playwright-driver.ts:305) returns false for webkit and firefox because playwright-core@1.61.1's browsers.json requires firefox revision 1532 and webkit revision 2311, while ~/Library/Caches/ms-playwright has only firefox-1538 and webkit-2336. Chromium-1228 matches, and the chromium-only AC-683 passes. The test and the AC are correct; a skip marker is forbidden; an engine-free rewrite could not prove cross-engine equivalence."
  proposed_change: "Environment (preferred, no repo change): the operator runs `pnpm --filter ./tools/generate exec playwright install webkit firefox` to install firefox-1532 and webkit-2311. Repo alternative (needs a code_frozen exception): bump `playwright` in tools/generate/package.json, and the lockfile, to the release whose browsers.json pins firefox 1538 and webkit 2336. Either way, test_UAT_AC688_no_layout_divergence_across_three_engines then runs and closes the orphan."
```