---
uid: acceptance_criterion-236187a6
id: AC-1809
type: acceptance_criterion
title: A content type the sender did not state is settled once from the filename,
  and classification, description and the stored-bytes record all read that one value
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:57:13.701972+00:00'
updated_at: '2026-11-01T03:52:29.265813+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

A sender declares whatever content type it observed, and for many textual formats a browser
observes nothing at all — it hands over an empty type, which the entry point reports as the
generic "unknown binary" one. Before the file is classified, described or its bytes recorded,
the ingestion settles that silence **once**, from the filename's extension, and every later
step of the same ingestion reads that one settled value.

- A file arriving with no declared type, or with the generic binary type, and a name whose
  extension names a format the platform has a reader for, is ingested as that format rather
  than as unknown bytes.
- The kind recorded on the material, the description written into its body, and the content
  type recorded against the stored bytes all agree: none of them can hold a different answer
  about what the file is from another.
- Observably, at the platform's own upload entry point: a Markdown file uploaded from a browser
  — which declares no type for one — is stored **described**: its text is read by the text
  decoder, the describer is shown the file's own words and its digest becomes the body (REQ-173)
  rather than an account of what could not be read, the file's full text is kept in the
  material's `material_text` comment, and the record of its stored bytes names a Markdown type
  rather than the generic binary one. The record is the durable form of the repair: a later pass
  that re-reads the file reads the settled type, not the sender's silence.

## Verification

With a describer configured, post a `.md` file through the platform's own upload entry point with
the declared type empty, exactly as a browser sends it, against a real store. Assert the answer
reports a described material filed as a document; that the describer was shown a distinctive
phrase from the file; that the body is the describer's digest (and does not contain the
unreadable-content wording), recorded as written by that describer via the text decoder; that the
`material_text` comment holds the file's own words; and that the record of the stored bytes names
the Markdown type. Repeat for an extension naming an image and one naming a font, asserting the
recorded kind and the recorded type agree in each case.
