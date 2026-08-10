---
uid: acceptance_criterion-bad505ff
id: AC-1091
type: acceptance_criterion
title: A replacement at an address that resolves to nothing is refused as not-found
  and writes nothing
created_by: xgd
created_at: '2026-08-10T09:20:17.396113+00:00'
updated_at: '2026-08-10T09:20:17.396113+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

Sending a replacement for an address that resolves to no element on the page is refused
with a not-found failure that directs the caller to re-read the page map, and nothing is
written — no element is created at that address and no neighbouring element is replaced
in its stead. The same holds for an address that is not well-formed, which is refused as
malformed rather than resolved to some nearby element.

## Verification

Capture the draft's bytes. Send a replacement at an address beyond the page's tree, and
another at a malformed address. Assert the first is a not-found refusal naming re-reading
the listing as the remedy, the second a malformed-address refusal, and the draft's bytes
are unchanged after both.
