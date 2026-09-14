---
uid: acceptance_criterion-236187a6
id: AC-1809
type: acceptance_criterion
title: A content type the sender did not state is settled once from the filename,
  and classification, description and the stored-bytes record all read that one value
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:57:13.701972+00:00'
updated_at: '2026-09-14T06:57:13.701972+00:00'
completed_at: null
last_field_updated: created_at
status: pending
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
  — which declares no type for one — is stored **described**, with the file's own words as its
  body rather than an account of what could not be read, and the record of its stored bytes
  names a Markdown type rather than the generic binary one. The record is the durable form of
  the repair: a later pass that re-reads the file reads the settled type, not the sender's
  silence.

## Verification

Post a `.md` file through the platform's own upload entry point with the declared type empty,
exactly as a browser sends it, against a real store. Assert the answer reports a described
material, the material's body contains a distinctive phrase from the file (and does not contain
the unreadable-content wording), the material is filed as a document, and the record of the
stored bytes names the Markdown type. Repeat for an extension naming an image and one naming a
font, asserting the recorded kind and the recorded type agree in each case.
