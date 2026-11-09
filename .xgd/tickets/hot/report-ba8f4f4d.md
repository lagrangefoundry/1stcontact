---
uid: report-ba8f4f4d
id: REPORT-11840
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T11:44:17.172444+00:00'
updated_at: '2026-11-09T11:44:17.172444+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-d0a8cfad
  parent_report_uid: report-c041c3b1
  batch_index: '0'
---

I couldn't make AC-688's three-engine test pass, and I made no edits. The engine builds the test needs aren't installed.

**What I checked:** The Playwright cache at `~/Library/Caches/ms-playwright` has these builds:
- **Firefox:** `firefox-1538` is installed, but the test needs `firefox-1532`.
- **WebKit:** `webkit-2336` is installed, but the test needs `webkit-2311`.
- **Chromium:** several builds are installed (1228, 1234, 1243, 1248).

Because the two pinned builds are missing, I did not run `test_UAT_AC688_no_layout_divergence_across_three_engines`. It also couldn't have run here, since browsers can't launch inside this session's sandbox. As the planner instructed, I did not retry the install, upgrade Playwright, change the engine check, or touch the test, AC-688 or the story. AC-688 and its test are correct; the failure comes from the gate environment and the XGD tooling defect BUG-1695.

**Fix for the operator:** run this from a terminal outside the sandbox, then re-run the gate:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

```yaml
## Assessment
status: stuck
failures:
  - test: tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    status: stuck
    cause: "Gate environment is missing the Firefox and WebKit builds that Playwright pins (firefox-1532, webkit-2311). This is XGD tooling defect BUG-1695, not a defect in the test, AC-688 or the code."
    evidence: "ls ~/Library/Caches/ms-playwright -> chromium-1228/1234/1243/1248, firefox-1538, webkit-2336; firefox-1532 and webkit-2311 are absent. Browsers cannot launch in this sandbox, so the test was not run."
    operator_remedy: "Outside the sandbox: pnpm --filter @1stcontact/generate exec playwright install webkit firefox, then re-run the gate."
edits: none
tooling_bug: BUG-1695
```