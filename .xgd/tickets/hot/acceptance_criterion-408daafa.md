---
uid: acceptance_criterion-408daafa
id: AC-2414
type: acceptance_criterion
title: Placing a point shows a lettered mark, reuses freed letters, and appends a
  pill to the draft
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:45:54.322819+00:00'
updated_at: '2026-11-08T12:45:54.322819+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- With Mark Points on, a left click on the preview places a mark at the click position. The mark is a high-contrast cross on a disc, labelled "Point <letter>".
- Each new point gets the lowest letter A–Z not already used by a point on screen. After Point A is deleted, the next point placed is labelled A again, not the next unused letter.
- Placing a point appends the pill `[Point <letter>]` to the end of the composer draft. Any text already in the draft is kept. The pill goes at the end, not at the caret.
- When all 26 letters are in use, a click places no mark and adds no pill.

## Verification
Through the real edit render with the overlay on, click three times and assert labels A, B, C, with the draft ending in the three pills in order. Delete A, click again, and assert the new mark is labelled A. Seed 26 live points, click again, and assert no 27th mark and no new pill.
