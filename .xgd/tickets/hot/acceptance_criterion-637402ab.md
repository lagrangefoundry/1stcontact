---
uid: acceptance_criterion-637402ab
id: AC-1736
type: acceptance_criterion
title: What the client said a file is for narrows the rights inferred from provenance,
  never widens them, and an answer outside the permitted two is refused rather than
  coerced
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:50:08.891348+00:00'
updated_at: '2026-09-11T06:00:05.898576+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

What the client said a file is for narrows the rights taken from where it came from, never widens
them, and an answer outside the permitted two is refused rather than read as one of them.

- **It narrows.** The same bytes, arriving under the two answers, produce two records that differ in
  exactly one place: the one marked *for the site* may be republished and the one marked *for the
  client to read* may not. Everything the provenance reading produced is identical across the two —
  both are recorded as the client's own, neither may be exported, and no ownership question was put
  to anyone.
- **Its absence changes nothing.** Material arriving with no answer at all is accepted, and reads
  back carrying none, with the provenance reading untouched: an uploaded file remains republishable
  and not exportable exactly as it did before the question existed. Callers that predate the
  question therefore behave exactly as they did.
- **A malformed answer is refused, never coerced.** An answer that is neither of the two — including
  one that differs only in capitalisation — is refused with a message naming what the two permitted
  answers are, and no material record and no stored bytes come into existence as a result. Both
  silent readings are wrong in a way nobody would notice: one publishes material the client marked
  private, the other withholds a photograph they meant to publish.
- **Nobody is asked about material the platform fetched on the client's behalf.** Such material is
  recorded as being for the client to read, whatever the caller supplied, because something pulled
  on their behalf is background to read rather than something they handed over to publish.

## Verification

Through the ingestion boundary, submit identical bytes twice under the two permitted answers, and
confirm the two stored records differ only in that answer and in whether they may be republished —
the ownership answer and the export answer are the same on both. Submit the same bytes with no
answer supplied and confirm the record is accepted, carries none, and reads back with the
provenance values unchanged. Submit an answer outside the two and confirm the request is refused
naming the permitted answers, and that a subsequent listing of the account's material does not
contain it. Ingest material the platform fetches and confirm the stored record reads as being for
the client to read.