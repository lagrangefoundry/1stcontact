---
uid: acceptance_criterion-5d459189
id: AC-1548
type: acceptance_criterion
title: A document's own text becomes its description, so material is found by what
  is inside the file
created_by: xgd
created_at: '2026-09-04T04:12:29.004570+00:00'
updated_at: '2026-09-04T04:12:29.004570+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

A document the client hands over is read for the text it contains, and that text becomes the
material's description — so the material is retrievable by words that appear inside the file and
never only by its filename.

The resulting record states:

- a description containing the document's own wording (a phrase present in the file is present in
  the description),
- an outcome of "a real description",
- a producer naming what read it,
- a title, which is the document's own declared title where it carries one, and otherwise the first
  substantial line of what was read, and otherwise the filename.

## Verification

Ingest a document whose text contains distinctive words and which declares its own title. Read the
created material back through the surface that serves it and assert the description contains those
words, the outcome is the real-description value, the producer field is non-empty, and the title is
the document's declared one rather than the filename or the first line. Repeat with a plain-text
file carrying no declared title and assert the title is its first substantial line.
