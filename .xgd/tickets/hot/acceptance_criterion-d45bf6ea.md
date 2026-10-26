---
uid: acceptance_criterion-d45bf6ea
id: AC-1725
type: acceptance_criterion
title: The overlay asks for the file's Purpose, offering Site asset and Background
  information with the privacy promise stated in words
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:15.955912+00:00'
updated_at: '2026-10-26T01:38:40.676530+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

The overlay asks what the file is **for**, not what kind of file it is, and offers exactly two
answers: **Site asset** (the file is for the site) and **Background information** (the file is
only for the platform to read). Each answer states, in plain language, what will happen to a
file given that answer — and the *Background information* answer states that such material will
not appear on the client's site.

Specifically, when the overlay is showing:

- A single top-level prompt is present, and it reads **Purpose**.
- Exactly two choice areas are present, in the order *Site asset* then *Background information*,
  each carrying a stable identifier for the role it means (`site`, `reference`). The labels are
  copy; the identifiers are the wire values a handover sends and are unchanged by the relabel.
- Each area shows its label and a sub-line of examples/consequences. The *Site asset* sub-line
  names photos, logos and fonts as things the client's visitors will see; the *Background
  information* sub-line names brand guidelines, notes and reports and states that the material
  will not appear on the site.
- No area asks the client to classify the file by type (image / document / font), and no area
  asks whether the client owns the file.

## Verification

Raise the overlay and read what a client would read: assert the prompt reads `Purpose`, that
there are exactly two choice areas carrying the identifiers `site` then `reference`, that their
labels read `Site asset` then `Background information`, that each area's declared label and hint
text are both rendered, and that the second area's text contains the promise that the file will
not appear on the site.
