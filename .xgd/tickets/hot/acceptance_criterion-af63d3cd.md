---
uid: acceptance_criterion-af63d3cd
id: AC-1554
type: acceptance_criterion
title: Material nothing here can read is kept and marked unreadable rather than half-guessed
created_by: xgd
created_at: '2026-09-04T04:12:41.376823+00:00'
updated_at: '2026-09-04T04:23:05.825549+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

Material that nothing here can read is kept and marked unreadable rather than refused or
half-guessed.

This covers a compressed typeface wrapper whose tables cannot be opened, an image in a format
nothing can look at, a document format nothing can extract text from, and material of a kind this
step does not describe at all.

The resulting record states:

- an outcome distinguishing "nothing here can read this" from a missing describer, a failed
  describer and an empty extraction,
- a description naming what could not be read — the declared type, or the reason the wrapper cannot
  be opened — and saying the material can be found by name rather than by its contents,
- a title and a description that still carry the file's own name, type and size,
- no producer.

A compressed typeface wrapper is recorded unreadable rather than parsed approximately: a confident
wrong family name is worse than an honest absence.

## Verification

Ingest, separately: a compressed typeface wrapper, a document of a format with no text extractor,
and an image in a format that cannot be looked at. Assert each request succeeds, each record's
outcome is the unreadable value, each description names the type or the wrapper by name, and each
record's bytes read back intact. Assert the typeface case reports no family rather than a guessed
one.