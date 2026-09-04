---
uid: acceptance_criterion-e7551e01
id: AC-1553
type: acceptance_criterion
title: A typeface is described from the names inside the font file, never guessed
  by a model
created_by: xgd
created_at: '2026-09-04T04:12:40.304138+00:00'
updated_at: '2026-09-04T04:12:40.304138+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

A typeface is described from the names carried inside the font file itself, not by guessing from its
bytes.

The resulting record states:

- a description naming the family and, where the file declares them, the style, the designer, and
  the designer's own sentence about what the face is for — each lifted from the file rather than
  invented,
- a note that the face is variable where the file declares variation axes,
- a title of the family, extended by the style where the style is not the plain one,
- an outcome of "a real description",
- a producer naming that the description came from the file's own embedded names rather than from a
  model.

No model is consulted for a typeface that carries its own names.

## Verification

Ingest an uncompressed OpenType/TrueType file whose embedded names include a family and a
descriptive sentence. Assert the description contains the family and that sentence verbatim, the
title is the family, the outcome is the real-description value, the producer identifies the
embedded-names route, and — with an image describer supplied and counting its invocations — that the
describer was never called.
