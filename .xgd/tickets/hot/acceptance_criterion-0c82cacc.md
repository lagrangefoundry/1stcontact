---
uid: acceptance_criterion-0c82cacc
id: AC-1688
type: acceptance_criterion
title: A document that carries text yields a digest of its content as the material's
  body and its own declared title where it has one; its words are kept in full on
  the text comment
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:22:28.200714+00:00'
updated_at: '2026-11-01T03:16:13.923047+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A document that carries extractable text becomes material whose **body is a digest** of what the
document is, while the document's **own words are kept in full** beside it rather than in it.

For a portable document with text:

- the body is the describer's digest — prose about the document, not a transcription of it — and
  is not the document's raw text;
- the document's full extracted text is returned alongside the description and contains the
  words of the document, not merely its name, type or size (the ingestion keeps it on the text
  comment — STORY-140);
- the title is the document's **own declared title** where the file carries one, and otherwise is
  drawn from the document's first substantial line; the describer never supplies the title;
- what the describer is shown is the head of the text plus a sample from further in when the
  document is long, so the digest is not written from the cover page alone;
- the recorded outcome is the described outcome, and the recorded describer names both the
  model that wrote the digest and the extractor that read the text.

A document whose declared title cannot be read, while its text can, still yields its text and
falls back to a derived title rather than failing. A document whose digest cannot be written —
no describer, or a describer that answers with nothing — still keeps its derived title and its
full text; only the body degrades.

## Verification

Hand a portable document containing a known sentence and a known declared title to the
description step with a text describer that returns a distinctive digest: assert the body is the
digest and does not contain the known sentence, the full text contains it, the title equals the
declared title, the outcome is described, and the describer names the model and the extractor.
Repeat with a document whose metadata is unreadable and assert the full text still carries the
sentence. Repeat with no text describer and assert the title is still the declared one and the
full text is still returned.
