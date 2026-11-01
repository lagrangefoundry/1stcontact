---
uid: comment-d99179aa
id: COMMENT-6131
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-01T11:07:12.720745+00:00'
updated_at: '2026-11-01T11:07:12.720745+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-17b2069d
  kind: note
---

I filed the iteration 2 fix plan as **REPORT-7568 (report-17b2069d)** for story-e674c60a. It has two batches and rules on the builder's request to unfreeze code for AC967.

**Batch 0: tests, ACs and story only. It covers AC967, AC964, AC975, AC1400 and the two orphaned ACs.**
- **AC967:** the builder wanted to change `app.js` so a failed site listing keeps the pane. My ruling is to align the AC with the reference code instead (`aligned_to_tip`).
  - The frozen code (`app.js:700`) and the reference (`app.js:2588-2594`) both turn an ordinary listing failure into an empty list. Only a refused session keeps the pane, and that comes from BUG-52, which is outside this story.
  - The "keeps the pane" claim came from the story's own decision (c), not from an intent. REQ-179 and REQ-180 say nothing about a failed listing.
  - The fix removes that clause from AC-967 and its test, and adds a correction to the story. It does not write "a failure empties the pane" into the spec, which was the builder's worry.
- **AC964 and AC1400:** the code is fine and the test setup is out of date. The gate now checks the caller against the D1 database before any route runs, but both tests hand it a database that throws when touched, so every call returns 503.
  - The builder will switch them to the existing helpers in `tests/support/local-d1.ts` (`applyLocalD1Schema`, `seedIdentity`).
  - The R2 site store stays unreachable, so the tests still fail if a route opens it.
  - AC1400's no-account check will use a configured account that has no row in the database. That matches the AC's own wording ("a store that holds no account at all").
- **AC975:** it is in the same test file as AC964 and passed on the builder's machine. The builder will run it together with the rest of the batch and look for shared state if it only fails there. The two orphaned ACs should clear once AC975 and AC1400 pass.

**Batch 1: AC960, with one exception to the code freeze.** A comment in `tools/generate/src/cli/ai/ledger-core.ts:17` writes the component scope `@lagrangefoundry`, which AC-960 forbids everywhere outside its one declaration, comments included. The reference has already reworded that comment, so the comment changes and the test stays as written. The exception covers that one comment and nothing else, and the plan also re-runs the tests of other code that uses `ledger-core.ts`.

I flagged three weak spots without blocking anything:
- AC975 passes quietly when no browser can be launched, though its AC requires it to report loudly.
- AC964 builds its own test environment instead of using the shared D1 helper.
- The frozen comment at `app.js:698-699` contradicts the code beneath it.

When the report was filed, the sandbox blocked an outbound connection to `github.com:22`, probably xgd trying to sync. The report was created locally; I didn't check whether it reached the remote.
