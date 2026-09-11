---
uid: acceptance_criterion-5b06d792
id: AC-1708
type: acceptance_criterion
title: An address the guard refuses never becomes material, and the refusal is the
  caller's error rather than a server failure or a rights refusal
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:43:02.298550+00:00'
updated_at: '2026-09-11T04:43:02.298550+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

An address the guard refuses **never becomes material**. For any refusal in this story — the scheme
rule, a private address, a refused redirect hop, the redirect bound, or the size ceiling — the
account's material after the attempt is exactly what it was before: no record, no attached bytes,
nothing to clean up and nothing for a later sweep to find pointing at a place the bytes never
reached.

The refusal is reported to the caller as the **caller's** error, alongside the address that was
refused, and is distinguishable from:

- a server failure, which it is not — the platform is working correctly when it refuses;
- a rights refusal, which is what promoting non-republishable material into a site's asset library
  produces, and which is a different answer to a different question.

## Verification

Count the account's material. Request a retrieval of the link-local metadata address through the
retrieval entry point; assert the response is a client-side refusal, that its message is the
guard's own wording, that it carries the refused address, and that the material count is unchanged.
Repeat for a private-block address and for an address whose first hop redirects to a refused one,
asserting an unchanged count each time. Assert the refusal status is distinct from the one a
non-republishable promotion produces.
