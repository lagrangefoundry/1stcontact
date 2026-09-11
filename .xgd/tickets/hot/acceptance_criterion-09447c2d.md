---
uid: acceptance_criterion-09447c2d
id: AC-1699
type: acceptance_criterion
title: A description body is bounded and says so where text was dropped, and a title
  is a single collapsed line
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:50.022146+00:00'
updated_at: '2026-09-11T04:35:57.436177+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A description body is **bounded, and the bound is stated in the text** rather than applied
silently.

- Extracted text beyond the body ceiling is not carried; the text up to the ceiling is.
- Where text was dropped, the body ends with a statement that it was truncated and at what
  length, so a description that stops mid-sentence is never mistaken for corruption.
- Material whose text is within the ceiling carries no truncation statement.
- A title is likewise bounded to a single readable line: internal line breaks and runs of
  whitespace are collapsed, and an over-long title ends with an ellipsis rather than being cut
  without a mark.

## Verification

Hand the step a document whose extractable text exceeds the body ceiling: assert the body length
is bounded, the retained text is the leading portion of the original, and the body ends with a
statement naming the truncation length. Hand it a short document and assert no such statement
appears. Hand it a document whose first line is longer than the title bound and assert the title
is a single collapsed line ending in an ellipsis.