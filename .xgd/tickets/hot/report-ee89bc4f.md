---
uid: report-ee89bc4f
id: REPORT-11752
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T07:58:13.379415+00:00'
updated_at: '2026-11-09T07:58:13.379415+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-d0a8cfad
  parent_report_uid: report-5ecd3a55
  batch_index: '0'
---

I'm reporting this one as **stuck**: AC-688's test can't run until the operator installs the right Firefox and WebKit builds. I made no edits and did not run the test.

- **Playwright cache:** it has `firefox-1538` and `webkit-2336`, and Chromium is present (`chromium-1228` among others). The planner's precondition was `firefox-1532` and `webkit-2311`.
- **What the pin needs:** `tools/generate` pins `playwright ^1.61.1`, and the installed version is 1.61.1. Its `browsers.json` (`node_modules/.pnpm/playwright-core@1.61.1/.../browsers.json`) asks for exactly `firefox` 1532 and `webkit` 2311.
- **Why the cached builds don't help:** they came from a newer Playwright install. Playwright 1.61.1 only launches the exact revision folder it expects, so they don't satisfy it. Chromium is fine.
- **What was left alone:** as the planner instructed, I changed nothing: not the test, the skip gate, AC-688, production code, the Playwright pin or the lockfile. I did not retry the install in the sandbox, and this session can't launch a browser anyway.

**Operator action**, run from a terminal outside the sandbox:
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```
Then re-run the gate for `test_UAT_AC688_no_layout_divergence_across_three_engines`.

```yaml
## Assessment
status: stuck
tracking: BUG-1695
evidence: "ls ~/Library/Caches/ms-playwright -> firefox-1538, webkit-2336 (no firefox-1532, no webkit-2311); playwright-core@1.61.1 browsers.json requires firefox revision 1532 and webkit revision 2311; tools/generate/package.json pins playwright ^1.61.1 (installed 1.61.1)"
operator_action: "pnpm --filter @1stcontact/generate exec playwright install webkit firefox"
edits: none
```