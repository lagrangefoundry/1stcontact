---
uid: comment-a2fc38be
id: COMMENT-8101
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T11:01:00.122102+00:00'
updated_at: '2026-11-09T11:01:00.122102+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7fe977b3
  kind: note
---

I filed the iteration 26 fix plan as **REPORT-11826 (report-7fe977b3)**. It's created locally. The sandbox blocked a background connection to `github.com:22`, so it may not have synced yet. It hasn't been through the plan check, so I don't know whether it will be accepted.

AC-688 won't clear inside this run. It needs one command from you, run in your own terminal:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

**Why it keeps failing:** AC-688's only test needs Chromium, WebKit and Firefox all to launch. This machine has a different version of WebKit and Firefox from the one this project's Playwright (1.61.1) expects, so those two don't launch and the test is skipped. The AC itself allows that skip, but the coverage check counts a skipped test as "no passing test". All 54 scoped tests pass; this is the only failure. The product code, the test and the AC are correct.

**What I did differently:** iterations 1–25 all planned the same thing. They kept the code freeze and asked the builder to install the browsers, which its sandbox can't do. This time I treated it as a fault in XGD's own tooling and filed **BUG-1697** (severity high) against XGD. It covers two problems:
1. The coverage check treats a skip the AC allows the same as missing evidence.
2. The fix loop has no way to stop when the only fix is something you have to do outside the run.

**The plan:**
- **One batch, just AC-688's test.** The builder doesn't try to fix it. It confirms why the test skips and reports itself stuck, citing BUG-1697 and the install command.
- **Optional diagnostic edit.** The builder may make the skip message name which browser failed to launch; the test's conditions and checks stay unchanged.
- **Code freeze kept.** I turned down the builder's request to lift it for a Playwright upgrade. The reference version pins `^1.61.1` in `tools/generate/package.json:21`, the same as the working tree, and none of the five bundled tickets ask for an upgrade.
- **No AC or story changes.**

If the run doesn't stop on BUG-1697, it will keep looping until the install has been run on the machine that runs the tests.