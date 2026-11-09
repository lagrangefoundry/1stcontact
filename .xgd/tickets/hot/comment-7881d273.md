---
uid: comment-7881d273
id: COMMENT-8161
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T22:05:51.244448+00:00'
updated_at: '2026-11-09T22:05:51.244448+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dce9564b
  kind: note
---

I've filed the iteration 13 fix plan as **REPORT-12034** (report-dce9564b). The nine failures have three separate causes, and none of them repeats the iteration-11 hypothesis. So I split them into three batches that edit different files.

| Batch | Tests | Cause | Fix | Ladder |
|---|---|---|---|---|
| 0, tests only | AC2485, AC2486, AC2489, plus AC2490, which was skipped but has the same problem | The tests still expect the picture inline in the URL the browser opens (`src="data:image/…;base64,…"`). Since the BUG-80 fix, that URL is a fixed shell and the bytes are sent afterwards by script. AC-2485 already describes the new behaviour, so the tests are out of date, not the code. | Make the fake browser record its scripts, as `reconciliation-stored-picture-delivery.test.ts` does. Then check that the URL is the fixed shell, that the delivered pieces join to the picture, and that each picture gets the right media type. | Rung 1 (BUG-80 supersedes REQ-218) |
| 1, override on `code_frozen` for `screenshot.ts` only | AC2565 | In `rasterizeImage`, the screenshot call (and the browser lease) sits outside the error wrapper, so a failed shot reaches the caller as the raw driver error. That error can carry a payload of several MB. | Move the screenshot and the lease inside the wrapped region so every failure becomes the short `ImageNotRenderableError` sentence. | Rung 1 (BUG-80 and AC-2565 name "taking the shot") |
| 2, test setup | AC2025, AC2372 (the "orphans") | Both Worker test files failed to load: `Cannot find module './generated/ai-ticketing.js'`. The test setup (`tests/global-setup-generated.ts`) only regenerates these files when one on its list is missing, and the list leaves out `ai-ticketing.js` (added by REQ-228), `ai-imagegen` and `auth-passwordless`. Only the node test project runs this setup; the Worker one doesn't. | Complete the list and register the same setup on the Worker project. | Rung 3 (the tests stand) |

- **Batch 1 override:** I put it at index 1 because a review rejection (REPORT-6909) is recorded against batch index 0. I marked it as touching a trust boundary because it decides what driver error text reaches the model. Its evidence is lines 312–315 and 347–380 of `screenshot.ts` at `reconcile-src-BUNDLE-44`. At line 375 the code leaves the screenshot call unwrapped, while its own comment at 312–315 says every driver call is wrapped.
- **Batch 2 timing:** the generated files on disk are dated 22:00:35Z, a minute after the 21:59Z test run. That supports the idea that they were missing when the suite ran.
- **ACs:** I didn't change any. Each AC already says what the code should do.
- **Weak spots flagged:** the stale assertion in the AC2490 test, plus two gaps in the fake browser in the stored-picture test file. It doesn't count browser closes, and its `query()` ignores the script it is given.

When the report was filed, the sandbox blocked an outbound connection to `github.com:22`. The report itself was created; that blocked connection may mean an automatic sync didn't happen.