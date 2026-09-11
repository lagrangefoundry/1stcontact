---
uid: acceptance_criterion-340b526a
id: AC-1659
type: acceptance_criterion
title: A host serves only the knowledge bases whose corpus it can reach, so the release
  build offers exactly the shipped one
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:35.554978+00:00'
updated_at: '2026-09-11T03:30:35.554978+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

A host serves only the knowledge bases whose corpus it can actually reach. The
release build, which has the shipped document corpus and no account store, offers
exactly the shipped knowledge base — one, named — even though the declaration
file it reads declares two.

The failure this prevents is not an error. A host handed a knowledge base whose
corpus it cannot reach resolves it anyway against whatever corpus it does have:
the client's knowledge base resolved against a directory of design documents holds
none of the four client record kinds, so it reports as searchable and empty, and
the session is primed with an apology for a map that host will never build.

## Verification

Run the release build's knowledge binding against the shipped declaration and
assert the set of knowledge bases it offers is exactly the shipped one. Assert
that asking it for the client's knowledge base does not yield an empty-but-valid
knowledge base.
