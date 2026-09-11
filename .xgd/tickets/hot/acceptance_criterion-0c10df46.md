---
uid: acceptance_criterion-0c10df46
id: AC-1695
type: acceptance_criterion
title: A font is described from the face's own name records — family, style, designer
  — rather than guessed at by a model
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:18.640694+00:00'
updated_at: '2026-09-11T04:35:58.000275+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A font is described from the face's **own name records**, not guessed at by a model.

For an uncompressed OpenType or TrueType file:

- the body names the family, and where the face carries them, the style, the designer and the
  designer's own sentence about what the face is for — text lifted from the file itself, so a
  phrase present in the font's name records is present in the description;
- a face carrying variation axes is described as a variable typeface;
- the title is the family name, extended with the style where the style is not the plain one;
- the recorded outcome is the described outcome, and the recorded describer identifies a
  name-record parse rather than a model;
- a face that names no family at all falls back to the unreadable-type outcome rather than
  producing an empty or invented family.

## Verification

Hand the step a real uncompressed font file whose name records carry a known family and a known
descriptive sentence. Assert the body contains both, the title is the family (plus style where
applicable), the outcome is described, and the describer identifies a name-record parse and not
a model identity. Assert a font-typed file with no readable family yields the unreadable-type
outcome.