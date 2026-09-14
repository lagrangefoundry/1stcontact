---
uid: acceptance_criterion-394eebc2
id: AC-1785
type: acceptance_criterion
title: An image's dimensions are readable without decoding it, from its opening bytes
  alone
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:06:11.156051+00:00'
updated_at: '2026-09-14T05:06:11.156051+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
Asking an image for its width and height costs a constant amount of work whatever
the image weighs: the answer comes from the header alone, so a file truncated to
its first 33 bytes still answers correctly, with the same values the whole file
gives. A file whose header is shorter than that, or whose first chunk is not the
header, is refused as malformed rather than answered with a guess.

This is what lets the crop verbs clamp a box before deciding they need pixels at
all.

## Verification
Read the dimensions of a tall screenshot fixture and assert the expected width and
height; then read them again from only the first 33 bytes of the same file and
assert the identical answer. Assert a shorter prefix is refused.
