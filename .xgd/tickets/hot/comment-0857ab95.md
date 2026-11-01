---
uid: comment-0857ab95
id: COMMENT-5995
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-01T02:53:50.141590+00:00'
updated_at: '2026-11-01T02:53:50.141590+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7597fd1f
  kind: note
---

I filed the iteration 2 fix plan as **REPORT-7228** (`report-7597fd1f`). The filing printed a blocked outbound connection to `github.com:22`, so the report is probably saved locally but not pushed.

**The cause:** `storedTranscript` at `tools/generate/src/cli/ai/host-core.ts:788` works out `live` as `closedPrefix(records).length !== records.length`. `closedPrefix` returns a number, not a list, so `.length` is `undefined` and `live` comes back true for every conversation with any records. That's why reopening after a finished turn says `live: true`, and a client that reattaches from the returned cursor hangs. I confirmed it in the AI library's `manager.js:963-983`: `manager.transcript()` already returns the correct `live`. That was the source the builder couldn't read last time, and it rules out their guess about trailing records.

**The ruling:** I granted the builder's `code_frozen` request on rung 2. The reference state (`reconcile-src-BUNDLE-34`, `host-core.ts:4742-4760` and `4794-4832`) already fixes this as BUG-64 by taking `live` from `manager.transcript()`. The override lets the builder edit only `host-core.ts`. The test for AC-2088 stays as written.

**The plan:** one batch.
- **AC-2088** is the failing test the code change should fix.
- **AC-1057** is included only to keep it green. The builder reported it fixed last iteration by rewriting the test and AC to match the current code, but this iteration's failure list still names it, and I didn't re-run it to check.
- **Dependency tests** are the other users of the open-session `live` flag: AC-1404, AC-1405, AC-1408, AC-1409, and the BUG-46 and BUG-38 test suites.

**Weak tests flagged:** the BUG-46 and BUG-38 suites never check that `live` is false after a turn completes, which is how this bug got past them.

No ACs or stories were changed.
