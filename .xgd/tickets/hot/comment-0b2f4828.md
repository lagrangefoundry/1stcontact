---
uid: comment-0b2f4828
id: COMMENT-8103
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T11:20:58.260965+00:00'
updated_at: '2026-11-09T11:20:58.260965+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0d9e4872
  kind: note
---

This loop can't fix AC-688: two browsers have to be installed on the gate machine, and only you can do that. Run this in your own terminal there:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

I filed the iteration 28 fix plan as **REPORT-11832** (report-0d9e4872). It was created locally, but the sandbox blocked the sync to `github.com:22`.

**Why it keeps failing:** all 54 scoped tests pass, and lint, build and preflight are clean. The one finding is AC-688. Its only test checks rendering across Chromium, WebKit and Firefox, and it runs only when all three start. This project's Playwright (1.61.1) expects firefox-1532 and webkit-2311, but the machine has firefox-1538 and webkit-2336. So the test is skipped. AC-688 allows that skip, but XGD's coverage check counts the skipped test as an orphan. The product code, the test and the AC are all correct.

**Nothing changed since iteration 27.** No product, test or AC file was touched, and the new quality run gave the same result. The plan stops repeating a hypothesis that was sent to the builder about 25 times and never cleared.

**The plan has no batches.** It follows XGD's rule (BUG-1067) for tests stuck on a defect in XGD itself: the last builder reported itself stuck on XGD defect BUG-1697, so the test is not sent back. The plan records the excluded test and the three-step decision in an `excluded_tests` field.

**What I ruled:**
- **Skip-marker rule:** the builder said the rule against adding skip markers was in its way. That rule can't be lifted, and the plan asks for no edit to the test.
- **Playwright upgrade:** not done. The reference version pins `^1.61.1` in `tools/generate/package.json:21`, the same as the working tree, and none of the five bundled tickets asks for an upgrade.

The browser install, or a fix to BUG-1697 in XGD's coverage check, will clear AC-688.