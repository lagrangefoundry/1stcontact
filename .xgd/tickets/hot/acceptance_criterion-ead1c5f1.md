---
uid: acceptance_criterion-ead1c5f1
id: AC-625
type: acceptance_criterion
title: Code blocks preserve verbatim text and optional language with no inline parsing
created_by: xgd
created_at: '2026-07-13T21:00:51.001764+00:00'
updated_at: '2026-07-13T21:00:51.001764+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
A code block preserves its text byte-for-byte through a round-trip: content that looks like inline notation (`[..]{..}`, `*`, backticks) or block structure is NOT interpreted, remaining literal. An optional language tag is preserved, and a code block with no language is equally valid. When the code text itself contains a run of backticks, the enclosing fence widens so the content stays enclosed and still round-trips.

## Verification
Round-trip a fenced code block whose text contains inline-notation-like characters and assert the text is unchanged; round-trip with and without a language tag; round-trip code containing a backtick run and assert the fence widened and the text is preserved.
