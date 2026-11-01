---
uid: acceptance_criterion-7e29a2bc
id: AC-1678
type: acceptance_criterion
title: An ingested file becomes a stored material record whose body is its description,
  and the answer reports what was stored
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:07:35.484478+00:00'
updated_at: '2026-11-01T03:52:23.260713+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

A file handed to the platform through its ingestion entry point is accepted and, in one
operation, becomes a piece of material the client owns:

- a stored record of type `material`, retrievable afterwards by its own identifier through an
  independently opened handle on the account's material store;
- whose **body is the description of the file** — the text the corpus is searched over — and
  whose title is a non-empty, human-readable name for it. For a document that description is a
  digest written by the configured describer from the file's own extracted text (REQ-173), not
  from its filename;
- carrying the file's own name, so the material can be listed without reading anything else;
- with its bytes attached, recorded with their size, their declared content type and a
  content hash.

The answer returned to the caller reports what was stored: the material's identifier, its
title, its classification (kind, rights, the two distribution bits, and where it came from),
the outcome of the description attempt, the attached file's identifier, hash, size and
content type, and whether the material was announced to the index.

## Verification

With a describer configured, send a real file through the ingestion entry point and assert the
response carries every field named above with the values that file implies. Then open a second,
independently constructed handle on the account's material store, read the record back by the
identifier the response gave, and assert its type, its title, its recorded filename, and that its
body is exactly the digest the describer wrote — with the describer having been shown text drawn
from the file (not the filename), and the record naming the describer and the extractor that read
it. Reading through a fresh handle rather than trusting the response is what makes this an
end-to-end assertion rather than an echo.
