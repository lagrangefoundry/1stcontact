---
uid: acceptance_criterion-9046fb58
id: AC-2095
type: acceptance_criterion
title: A document's full extracted text is stored once as a material_text comment
  on its material, bounded and marked where truncated
created_by: xgd
created_at: '2026-11-01T03:16:51.746999+00:00'
updated_at: '2026-11-01T03:16:51.746999+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

When an ingested document yields extractable text, the ingestion writes **exactly one comment** on
the new material, marked as the material's text (`material_text`), holding the document's **full
extracted text** rather than its digest.

- The comment is written as part of the same ingestion, after the material is created and before
  the ingestion returns, and is not edited afterwards.
- It holds the whole extracted text up to the full-text ceiling; past that ceiling it holds the
  leading text followed by a statement naming the truncation length.
- The material's own body is the digest, not this text.
- The ingestion's answer names the comment's identifier as `text_comment`.
- Material with no extractable text — an image, a font, a scan, an unreadable type — gets no text
  comment, and its answer carries `text_comment: null`.

## Verification

Ingest a document containing a distinctive sentence through the upload entry point with a
describer configured. Assert the answer's `text_comment` is non-null; read the material back
through an independently opened store and assert there is exactly one `material_text` comment on
it, that comment's identifier matches the answer, it contains the distinctive sentence, and the
material's body does not. Ingest an image and assert `text_comment` is null and no such comment
exists on it.
