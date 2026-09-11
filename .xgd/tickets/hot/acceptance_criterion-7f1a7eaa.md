---
uid: acceptance_criterion-7f1a7eaa
id: AC-1689
type: acceptance_criterion
title: A text-shaped file becomes material whose body is its decoded contents, titled
  by its first substantial line
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:22:43.514110+00:00'
updated_at: '2026-09-11T04:22:43.514110+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A text-shaped file — plain text, Markdown, structured text such as JSON or XML, or a vector
image expressed as markup — becomes material whose body is its decoded contents.

- The body is the file's text, decoded, not a summary of its name and size.
- The title is the first substantial line of that text, with any leading heading marks removed,
  and the filename only where no line qualifies.
- The recorded outcome is the described outcome, and the recorded describer names a decoding
  describer rather than being empty.

## Verification

Hand the description step a Markdown file whose first line is a heading and whose body contains
a distinctive phrase; assert the material's body contains that phrase, the title is the heading
text without its marks, and the outcome is described with a non-empty describer. Repeat for a
structured-text file to show the type family, not one extension, is covered.
