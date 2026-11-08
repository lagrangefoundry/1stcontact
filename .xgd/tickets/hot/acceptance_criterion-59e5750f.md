---
uid: acceptance_criterion-59e5750f
id: AC-2482
type: acceptance_criterion
title: An edit picture carries a 'behaviour is off' caption on the block the model
  reads, compare reports the caveat when either side is from the edit channel, and
  a draft picture carries no caption
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:43:40.244653+00:00'
updated_at: '2026-11-08T21:43:40.244653+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A picture says which channel it is of when that matters.
- **`screenshot` of an `edit` picture.** The leading text block, after the label and size, carries one caption: this is the edit channel, which ships no behaviour; panels, carousels and disclosures show their settled state, and nothing on it opens, advances or submits; take the same page as a `draft` picture to see what a visitor gets. The caption is on the same text block that names the picture, so it survives if the image is removed from a transcript.
- **`compare`.** When either side is an `edit` picture, the result carries that caption in a `notes` list. When neither side has a caption, there is no `notes`.
- **Other pictures.** A `draft` picture, driven or not, carries no channel caption.

The `screenshot` description tells the model that an `edit` picture says so and that it should not reason about a visitor's view from it.

## Verification
Call `screenshot` on `edit` and assert the first text block contains "ships no behaviour" and "draft". Call it on `draft` and assert neither phrase appears. Call `compare` with `edit` against `draft` and assert `notes` holds the caption once. Call `compare` with `draft` against `draft` and assert there is no `notes` key.
