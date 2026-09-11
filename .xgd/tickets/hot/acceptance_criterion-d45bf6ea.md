---
uid: acceptance_criterion-d45bf6ea
id: AC-1725
type: acceptance_criterion
title: The overlay asks what the file is for, offering two roles with the privacy
  promise stated in words
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:15.955912+00:00'
updated_at: '2026-09-11T05:32:15.955912+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

The overlay asks what the file is **for**, not what kind of file it is, and offers exactly two
answers: one meaning *put it on the site* and one meaning *just for you to read*. Each answer
states, in plain language, what will happen to a file given that answer — and the *just for you
to read* answer states that such material will not appear on the client's site.

Specifically, when the overlay is showing:

- A single top-level prompt is present, and it asks about the file's purpose.
- Exactly two choice areas are present, in the order *put it on the site* then *just for you to
  read*, each carrying a stable identifier for the role it means (`site`, `reference`).
- Each area shows a label and a sub-line of examples/consequences; the *just for you to read*
  sub-line states that the material will not appear on the site.
- No area asks the client to classify the file by type (image / document / font), and no area
  asks whether the client owns the file.

## Verification

Raise the overlay and read what a client would read: assert the purpose prompt is present, that
there are exactly two choice areas carrying the two role identifiers in that order, that each
area's declared label and hint text are both rendered, and that the second area's text contains
the promise that the file will not appear on the site.
