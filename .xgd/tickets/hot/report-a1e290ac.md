---
uid: report-a1e290ac
id: REPORT-11948
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T16:34:41.918694+00:00'
updated_at: '2026-11-09T16:34:41.918694+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-d0a8cfad
  parent_report_uid: report-23c5d96b
  batch_index: '0'
---

Nothing needed fixing: `test_UAT_AC687_multiple_violations_all_reported_with_path_and_message` passes now (`npx vitest run tests/reconciliation-l1-substrate.test.ts -t test_UAT_AC687_` → 1 passed, the file's other 8 tests filtered out). I changed no tracked file: no production code, test, AC or story, and `git status` is clean. The only new file is the untracked probe script `.xgd/tmp/engine-probe.mjs`. It loads Playwright from `tools/generate` and launches each engine the same way `engineAvailable()` does (`tools/generate/src/cli/capture/playwright-driver.ts:305`), but prints the error instead of returning `false`.

## Why AC-688 can't run here: two separate blockers

**1. WebKit and Firefox: the installed browser builds are the wrong version.** This one needs an operator to install browsers.

| | Playwright version resolved from `tools/generate` | Revision it expects | Revision in `~/Library/Caches/ms-playwright` |
|---|---|---|---|
| playwright | 1.61.1 | | |
| playwright-core | 1.61.1 | | |
| webkit | | **2311** (26.5) | **2336** |
| firefox | | **1532** (151.0) | **1538** |
| chromium / headless-shell | | 1228 | 1228 (also 1234, 1243, 1248) |

The launch errors, verbatim:
```
webkit:  browserType.launch: Executable doesn't exist at /Users/martin/Library/Caches/ms-playwright/webkit-2311/pw_run.sh
         ... Please run the following command to download new browsers: npx playwright install
firefox: browserType.launch: Executable doesn't exist at /Users/martin/Library/Caches/ms-playwright/firefox-1532/firefox/Nightly.app/Contents/MacOS/firefox
         ... npx playwright install
```

The cached webkit-2336 and firefox-1538 builds were installed by a different Playwright version, so 1.61.1 never looks at them. Allowing the sandbox more would not help: even unsandboxed, these two engines would fail exactly the same way.

To fix it, the operator runs `npx playwright install webkit firefox` from `tools/generate`, outside the sandbox. That downloads webkit-2311 and firefox-1532. The alternative is pinning `playwright` to the version that ships 2336/1538, which is a dependency change.

**2. Chromium: the sandbox blocks it.** The build is present and correct, but it aborts on launch:
```
FATAL:base/apple/mach_port_rendezvous_mac.cc:159] Check failed: kr == KERN_SUCCESS.
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.68260: Permission denied (1100)
<process did exit: exitCode=null, signal=SIGTRAP>
```
This is the known BUG-1685/BUG-1695 sandbox restriction. Inside the sandbox, all three engines would hit it once WebKit and Firefox are installed.

## What the operator needs to do
1. Install the browser builds Playwright 1.61.1 expects: `npx playwright install webkit firefox` from `tools/generate`, run from a normal terminal. This is required whatever happens with the sandbox.
2. Then AC-688 can only run in the validation gate or an operator terminal, never in a sandboxed session, until XGD BUG-1695 is resolved.

```yaml
## Assessment
status: verified_green
test: tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
edits: none (tracked tree clean; untracked probe at .xgd/tmp/engine-probe.mjs)
diagnostic_findings:
  playwright: "1.61.1"
  playwright_core: "1.61.1"
  webkit: {expected_revision: 2311, cached_revision: 2336, error: "Executable doesn't exist at ~/Library/Caches/ms-playwright/webkit-2311/pw_run.sh"}
  firefox: {expected_revision: 1532, cached_revision: 1538, error: "Executable doesn't exist at ~/Library/Caches/ms-playwright/firefox-1532/firefox/Nightly.app/Contents/MacOS/firefox"}
  chromium: {expected_revision: 1228, cached: true, error: "bootstrap_check_in MachPortRendezvousServer: Permission denied (1100) — sandbox (BUG-1695)"}
  ac688_operator_action: "Install the matching browsers (npx playwright install webkit firefox from tools/generate, unsandboxed). Required whatever happens with the sandbox; after that AC-688 still needs the gate or a terminal run until BUG-1695 is resolved."
```