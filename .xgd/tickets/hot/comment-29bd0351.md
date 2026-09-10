---
uid: comment-29bd0351
id: COMMENT-2520
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T11:25:06.136999+00:00'
updated_at: '2026-09-10T11:25:06.136999+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b9edb947
  kind: note
---

**REPORT-3721 (`report-b9edb947`) — FAIL: 1 violation, 0 warnings, 0 needs_review.**

## What I found

Attempt 7's repair is real. I re-verified all four violations and both warnings from REPORT-3719 against the live ticket bodies and the code on this branch rather than taking the fix report's word:

- **STORY-82** — required `form` slot + per-element `control` leaves, `labelMode` restored as a captured a11y fact, post-REQ-87 vocabulary throughout. Matches `packages/framework/src/modules/contact-form/meta.ts:41-47,57-61,66-78`.
- **STORY-83** — the negated renderer clause is replaced by a section that states the mount and records the carve-out's two pre-conditions. Matches `render.ts:2150-2168`. STORY-81 merge note corrected.
- **STORY-85** — REQ-93's page-level rule and `mountInL1` now expressed; the `mountInL1` text matches `conformance/harness.ts:92-145` verbatim.

## The one violation — introduced by the repair itself

STORY-85's new rejection table is headed "**Each of these is an error** with a machine-readable path, not a silent no-op" and lists six rows. **Orphan seam is not an error.** `pageSchema.superRefine` (`packages/site-schema/src/schema.ts:568-635`) raises issues for exactly five conditions and never iterates unbound seam names; `grep -rn "orphan"` over the schema and framework sources returns nothing. The row's own `why` column contradicts the table header ("legal, but the mount is absent"), and STORY-83's repaired section asserts the same legality positively — so the two stories now disagree, and one disagrees with the code.

The trail: REQ-93's appended *"Implementation (delivered)"* narrative claims an orphan rejection landed. Its planning half (Scope §1, Acceptance) never asks for one, and the code doesn't have one. REPORT-3719's finding 4 repeated the narrative's line, and attempt 7 faithfully transcribed it.

I rated this a violation rather than a warning because REPORT-3720 explicitly forwarded these rejections to the AC cycle as an `ac-add`. An AC written from the table as it stands would demand orphan rejection, and its UAT would fail against correct code — turning a one-row story defect into a false `code-issue`. The fix is moving one row into the existing "Both empty is legal" sentence; the rest of the section checks out and shouldn't be touched.

Ledger is unchanged since the last cycle — every request/bug updated after 2026-08-25 was re-listed, and nothing in that window is substrate intent.
