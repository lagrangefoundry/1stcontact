---
uid: comment-f1bdccf0
id: COMMENT-8040
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T21:57:19.386350+00:00'
updated_at: '2026-11-08T21:57:19.386350+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5fd3e355
  kind: note
---

I filed the iteration 6 fix plan as **REPORT-11590 (report-5fd3e355)**. It has one batch covering three failures (two tests plus the AC-2026 orphan). Before planning, I ran both failing tests to get the actual assertion errors, because the quality report didn't capture them.

**AC-2026 (and its orphan): the AC and its test were out of date, not the code.**
- The test expects a picture schema with five kinds and six keys. REQ-218 is in scope in this bundle and later than REQ-157. It added a sixth kind, `image`, with `image` and `original` keys. Together with REQ-216's `after`, that makes nine keys.
- The declaration at `reconcile-src-BUNDLE-42:tools/generate/src/cli/ai/fidelity-surface.json:9-64` already has exactly that shape.
- I rewrote AC-2026 in place to six kinds and nine keys, with an erratum note. The batch tells the builder to update the test to match and to leave the declaration alone.
- The orphan should clear once that test passes.

**AC-2479: the test is right and the code is wrong.** REQ-216 says "There is no way to name a selector, an id or an attribute", and that a menu matches an option's label first and its value second. `interact.ts` does neither:
- `fillNames` (lines 204-205) adds a field's `name` attribute and `id` to the names it can be filled by.
- Menu options are matched label-or-value in one pass (line 284), so an earlier option whose value equals the wanted words wins.

The working tree is identical to the reference here. I granted a `code_frozen` override at rung 1 for `tools/generate/src/cli/capture/interact.ts` only. Its dependency tests are `test_UAT_FC_REQ-216_`, `test_UAT_FC_REQ-218_` and the story's other drive-the-draft UATs (AC2477–2482).

I also flagged two passing REQ-216 tests whose fixtures could never catch these bugs.

Both the report and the AC-2026 update were saved locally. A push to `github.com:22` was blocked by the sandbox at the same time, so they may not be on the remote yet.