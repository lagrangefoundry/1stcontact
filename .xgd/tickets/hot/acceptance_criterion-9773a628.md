---
uid: acceptance_criterion-9773a628
id: AC-1702
type: acceptance_criterion
title: Every redirect hop is re-validated, and a hop the rules refuse is never retrieved
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:42:32.746154+00:00'
updated_at: '2026-09-11T04:42:32.746154+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

The address rules are re-applied to **every hop of a redirect**, not only to the address the
client supplied — and a hop that fails them is never retrieved.

Given a permitted public address that responds with a redirect to a refused address:

- the retrieval is refused, with the message the refused family would produce;
- the redirected-to address is **never requested** — the count of addresses actually reached is
  the hops that passed the rules, and the refused one is not among them;
- the refusal reports the address the client originally supplied, because that is the one they
  will recognise.

A redirect destination given relative to the hop it came from is resolved against that hop before
being checked, so a relative redirect cannot escape the rules.

## Verification

Drive the retrieval against a controlled responder that records every address it is asked for. The
first address is public and answers with a redirect whose destination is the link-local metadata
address. Assert the retrieval is refused as a private address, and assert the recorded list of
addresses reached contains **only** the first address — the metadata address was never requested.
Assert the refusal names the originally requested address. Repeat with a relative redirect
destination that resolves to a refused address and assert the same refusal, confirming resolution
happens before the check rather than after.
