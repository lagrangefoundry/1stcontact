---
uid: acceptance_criterion-09447c2d
id: AC-1699
type: acceptance_criterion
title: A description body is a bounded digest and a title is a single collapsed line;
  full text is bounded separately on the text comment
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:50.022146+00:00'
updated_at: '2026-11-01T03:16:22.715610+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A description body is a **bounded digest**, a title is a **single collapsed line**, and a
document's full text is **bounded separately**, far above the body's ceiling. Every bound that
bites is stated in the text rather than applied silently.

- The body ceiling bounds the digest. Where it bites, the body ends with a statement that it was
  truncated and at what length; a body within the ceiling carries no such statement.
- The full extracted text has its own, much larger ceiling. Text beyond it is not carried; the
  leading text up to it is, followed by a statement that it was truncated and at what length, so
  text that stops mid-sentence is never mistaken for corruption. Text within the ceiling carries
  no truncation statement.
- The two ceilings are different: full text well beyond the body's ceiling is kept whole on the
  full-text side.
- A title is bounded to a single readable line: internal line breaks and runs of whitespace are
  collapsed, and an over-long title ends with an ellipsis rather than being cut without a mark.

## Verification

Hand the step a document whose extractable text exceeds the body ceiling but not the full-text
ceiling: assert the full text is returned whole with no truncation statement and the body is the
bounded digest. Hand it a document whose text exceeds the full-text ceiling: assert the full
text is the leading portion of the original and ends with a statement naming the truncation
length. Configure a describer returning a digest longer than the body ceiling and assert the
body is bounded and states its truncation. Hand it a document whose first line is longer than
the title bound and assert the title is a single collapsed line ending in an ellipsis.
