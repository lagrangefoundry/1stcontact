---
uid: acceptance_criterion-06157387
id: AC-1588
type: acceptance_criterion
title: A material or a reference may record what the client said the file is for,
  and a value outside the permitted set is refused rather than coerced or dropped
created_by: xgd
created_at: '2026-09-04T05:07:45.317690+00:00'
updated_at: '2026-09-04T05:13:21.112965+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

A material and a reference may each record **what the client said the file is for** — one of
exactly two answers, *for the site* or *for the assistant to read* — as part of the same shared
statement that carries their rights and provenance. It is the only thing about a file the platform
asks, because it is the only thing provenance cannot answer: a photograph destined for the site and
a screenshot of a competitor the assistant should read but must never publish are identical bytes
with an identical file sort, and no rule over where the bytes came from separates them.

Three properties, each observable at the store:

- **It is optional, and its absence is an ordinary state rather than a refusal.** A material or a
  reference created without it is accepted and reads back with no such answer. Material created by a
  path that was never in a position to ask — anything ingested programmatically — is a valid record,
  and its rights stand on its provenance alone.
- **A value outside the two permitted answers is refused.** Creating a material or a reference
  naming anything else fails with a validation error and no record comes into existence as a result.
  The value is never coerced to one of the two, and never dropped so the record is stored without
  it: a misspelling that silently became *for the site* would publish something nobody meant to
  publish, and one that silently vanished would leave the answer unrecorded with nothing said. This
  holds for a value that differs from a permitted answer only in capitalisation, which is not a
  member and is refused like any other non-member.
- **It is not a reading of the republish answer.** A record may state that it may be republished and
  still record that it is for reading rather than for the site — a capture of the client's own
  previous site is exactly that — so the two are accepted together and read back independently, and
  neither may be derived from the other.

The answer is carried identically by both kinds that hold the rights statement, and by neither the
brief nor anything else.

## Verification

Through an account-scoped store, create a material and a reference each recording what the file is
for, and confirm both read the answer back unchanged. Create one omitting it and confirm it is
accepted with the answer absent. Attempt to create records naming a value outside the two permitted
answers, including one differing from a permitted answer only in capitalisation, and confirm each
fails as a validation error and that a subsequent listing of the account's records contains none of
them. Finally create one that is republishable and yet records that it is for reading, and confirm
it is accepted with both values as supplied.