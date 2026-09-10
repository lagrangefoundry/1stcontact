---
uid: comment-b670bff5
id: COMMENT-2521
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T11:26:53.185482+00:00'
updated_at: '2026-09-10T11:26:53.185482+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1bc4b808
  kind: note
---

Attempt 8 complete. One violation, one mutation.

**What was wrong.** REPORT-3720's repair of STORY-85 added a rejection table under "Binding is validated, never best-effort. Each of these is an error…" listing six rows — but the sixth, **orphan seam**, is not an error. The row even contradicted its own table header, with a `why` column reading "legal, but the mount is absent". Its source was a single line in REQ-93's appended "Implementation (delivered)" narrative, which disagrees with REQ-93's own planning half and with the code.

**What I did.** Moved that one row out of the table and into the sentence that already records legal states, at `story-179b8c06` — "Both empty is legal … So is an **orphan seam**: a `slot` in the tree that no module binds is *not* rejected." The five surviving rows, the error framing, the STORY-83 cross-reference and the `mountInL1` paragraph are untouched, as the report asked.

**Verified rather than assumed.** I read `packages/site-schema/src/schema.ts:560-640` directly instead of trusting the report. `pageSchema.superRefine` raises issues for exactly the five conditions the surviving rows name (`schema.ts:566-576`, `579-586`, `590-599`, `601-610`, `612-618`), then falls through — nothing computes `available` minus `bound`. The doc comment at `schema.ts:540-544` enumerates four rejections and omits orphan; `grep -rn "orphan"` over `packages/site-schema/src` and `packages/framework/src` returns nothing. I did not consult REQ-93's delivered-record section, per the report's note that it is the origin of the error.

STORY-83 already states the same legality positively, so the two stories now agree with each other and with the emitter. I swept the capability's other five stories for the same claim — none carry it, so no parallel edit was needed. No code edits; `uat_coverage` left alone.

Completion report is REPORT-3722 (`report-1bc4b808`): `violations_remaining: 0`, `needs_more_work: false`, so the assessor runs next rather than another fix iteration. Forwarded to the AC cycle: the `ac-add` for the page-level rejections and `mountInL1` now inherits a corrected five-row list — which was the point of fixing this at the story level, since an AC written from the old table would have demanded an orphan-seam rejection and produced a UAT that fails against correct code.
