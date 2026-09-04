---
uid: acceptance_criterion-0886b8f6
id: AC-1537
type: acceptance_criterion
title: Material retrieved on the client's behalf is recorded against the address the
  bytes finally came from
created_by: xgd
created_at: '2026-09-04T03:53:26.104202+00:00'
updated_at: '2026-09-04T03:53:26.104202+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

Asking the platform to retrieve a permitted web address on the client's behalf creates one piece of
material from what came back, through the same pipeline as a file the client hands over: same
record shape, same description step, same answer.

Two things are specific to retrieval:

- The material records the address the bytes **finally** came from. Where the request was
  redirected, the recorded address is the last hop, not the one the caller asked for.
- The name the material carries is derived from that final address rather than being asked for.

An address that returns nothing to store — an empty document, or an unsuccessful answer — creates
no material, and the refusal names the address that was asked for.

## Verification

Point the retrieval entry point at a permitted address and assert a material record is created,
that its recorded source address is that address, and that its stored bytes are what the address
returned. Repeat against an address that redirects once to a second permitted address: assert the
recorded source address is the second one, not the first. Repeat against an address answering with
an empty body and against one answering unsuccessfully: assert no material record exists afterwards
in either case and that the refusal names the requested address.
