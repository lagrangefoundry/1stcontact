---
uid: comment-43b71b33
id: COMMENT-8013
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T16:57:54.988989+00:00'
updated_at: '2026-11-08T16:57:54.988989+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9d5e887b
  kind: note
---

I filed the iteration-4 fix plan as **REPORT-11522** (`report-9d5e887b`). It has one batch with three tests, and all three fixes are test-only. I haven't run the fixes; the batch gate will. xgd's sync to `github.com:22` was blocked by the sandbox again, so the report exists only locally until a sync runs outside it.

**AC-2418 (Marked Points drag): a wrong statement order in the test.** I reproduced this one.
- The test calls `controller.expand()` (the send), which marks every point as sent.
- Afterwards, the hover-title block added by the last review fix (`fc268d3051`) reads `controller.list()`. That only returns points not yet sent, so it gets `undefined` and crashes.
- The code is right: REQ-210 says points clear on send.
- **Fix:** move the hover-title block to just before `expand()`. The final "a sent mark cannot be dragged" step stays after it.

**AC-960 and AC-961: other suites' asset builds leak into these tests.**
- Both tests scan the source tree for a second copy of something:
  - AC-960 looks for the `SITE_TAB` label.
  - AC-961 looks for a `mountShell` definition.
- The scans skip `dist-assets`, but not the two folders the build creates beside it: `dist-assets.staging` and `dist-assets.retired` (`assets.ts:1353`, `:1403-1407` at the reference ref).
- Five suites run `1c assets` against the real repo in parallel, and the newest of them arrived in that same review commit.
- While one of them is mid-build, the staging folder holds copies of `builder/config.js` and the webui components, so each scan finds a second copy and fails.
- AC-960 passes when I run it alone. I couldn't run AC-961 here because the sandbox blocks local ports, so for AC-961 this cause is inferred from the code, not observed.
- **Fix:** have both scans skip any folder named `dist-assets` or starting with `dist-assets.`, as build output. No production code changes.

**Ladder:** rung 1 decided both. REQ-210 makes a sent point leave the live list, and BUG-71 requires building into a staging folder and swapping it in. Rung 2 agrees, citing the line numbers above. The assertions themselves stay as they are.

There were no spec changes and no `blocked_by` request to rule on. The three hypotheses are new; iterations 1–3 dealt with the REQ-211 tests, which now pass.

I flagged one fragility for later: AC-977 and the suites that build assets all share the live `dist-assets` folder while running in parallel. AC-977 can break during the build's folder swap, and two builds running at once share one staging folder.