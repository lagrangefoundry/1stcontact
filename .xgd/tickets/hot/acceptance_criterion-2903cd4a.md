---
uid: acceptance_criterion-2903cd4a
id: AC-1237
type: acceptance_criterion
title: The origin exposes the same read and the same four writes as the command line,
  under a closed operation vocabulary, answering every write with the re-taken census
created_by: xgd
created_at: '2026-08-20T01:20:39.745573+00:00'
updated_at: '2026-08-20T01:20:39.745573+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

The palette is reachable over the builder origin as well as from the command line, and the two
answer alike:

- The origin read returns the same palette document — the same entries, colours and counts — that
  the command-line read returns for the same site, and requires the site to be named.
- The origin accepts the four writes under a **closed** vocabulary of operation names; a request
  naming an operation outside that vocabulary is refused with a client-error status and a message
  naming the operation, rather than failing as a server error.
- Every write accepted at the origin answers with the result of that operation **and the whole
  re-taken palette census**, so a caller redrawing a view of the palette does so from what the
  site now holds rather than from its own guess at what changed — a removal changes the list, a
  rename changes a name and no count, and the caller needs neither to know which.
- The same four writes are available from the command line, each reporting the result of the
  operation.

## Verification

For one seeded site: fetch the palette from the origin and assert it equals the command-line
read exactly. Perform each of add, change, rename and remove from the command line and assert
each succeeds and the palette ends in the expected state. Post an operation name that is not one
of the four and assert a client-error status. Post a valid write and assert the response carries
both the operation's own result fields and the full list of entries with their counts as they
now stand.
