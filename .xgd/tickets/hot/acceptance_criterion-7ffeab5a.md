---
uid: acceptance_criterion-7ffeab5a
id: AC-1682
type: acceptance_criterion
title: Kind is taken from the declared content type, from the filename where the type
  says nothing, and an unrecognised file is kept as a document
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:07:52.992866+00:00'
updated_at: '2026-09-11T04:07:52.992866+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

What kind of thing a file is, is decided by the system and recorded on the material:

- the **declared content type leads**: a type announcing a picture yields an image, a type
  announcing a font yields a font;
- the **filename is consulted only where the content type says nothing** — an absent type, or
  the generic "unknown binary" type — so a font or a picture delivered without a usable type
  is still filed as a font or a picture from its extension;
- **anything unrecognised is filed as a document and kept**, never refused: an unfamiliar type
  costs an honest account of what could not be read, not the file.

The recorded kind is one of the closed vocabulary the material record declares; there is no
"other".

## Verification

Ingest the same bytes several times with varying declared type and filename: a picture type;
a font type; a generic binary type with a font extension; a generic binary type with an image
extension; a generic binary type with an extension matching nothing. Assert the recorded kind
for each, ending with the unrecognised case being accepted as a document rather than refused.
Parameterize over the cases rather than writing one test per pair.
