---
uid: comment-81aed0d7
id: COMMENT-8102
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T11:13:14.610157+00:00'
updated_at: '2026-11-09T11:13:14.610157+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ec1cebe9
  kind: note
---

The fix will not happen inside this run: AC-688 needs two browsers installed on the gate machine, which only you can do. I filed the iteration 27 fix plan as **REPORT-11830** (report-ec1cebe9). It was created locally, but the sandbox blocked a sync to `github.com:22`, and it hasn't been through the plan check yet.

**Run this in your own terminal on the gate machine:**
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

**Why it keeps failing:** the 54 scoped tests all pass; AC-688 is the only failure. Its one test checks rendering across Chromium, WebKit and Firefox, and runs only if all three start. This project's Playwright (1.61.1) expects firefox-1532 and webkit-2311, but the machine has firefox-1538 and webkit-2336. So WebKit and Firefox don't start and the test is skipped. The AC allows that skip, but the coverage check counts a skipped test as "no passing test". The product code, the test and the AC are all correct.

**This plan has no batches.** The last builder confirmed the skip, made no changes, and reported itself stuck on an XGD tooling bug, BUG-1697. XGD's rules say a test stuck that way is not sent back to the builder, and sending it back had already produced the same stuck result 26 times. I couldn't confirm BUG-1697 exists, because it isn't in this project's tickets. The iteration 26 planner says it filed it against XGD itself.

**What I ruled:**
- **Skip-marker rule:** the builder said the rule against adding skip markers was in its way. That rule can't be lifted, and the plan asks for no edit to the test.
- **Playwright upgrade:** not done. The reference version pins `^1.61.1` in `tools/generate/package.json:21`, the same as the working tree. None of the five bundled tickets asks for an upgrade.

The plan records why the test was left out and the three-step decision in an `excluded_tests` field, because with no batch there was nowhere else to put it. The plan check may reject a plan with no batches. If it does, XGD substitutes a default plan that sends the test back to the builder, which will get stuck the same way. Either way, the install command above is the actual fix.