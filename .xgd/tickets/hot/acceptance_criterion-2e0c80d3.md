---
uid: acceptance_criterion-2e0c80d3
id: AC-1544
type: acceptance_criterion
title: Only safe public web addresses are retrieved; everything else is refused by
  name before any request is made
created_by: xgd
created_at: '2026-09-04T03:53:44.606760+00:00'
updated_at: '2026-09-04T03:53:44.606760+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

The platform retrieves only addresses that are safe to retrieve, and refuses the rest by name
before anything is requested over the network:

- Only secure web addresses are retrieved. An insecure one is **refused, never silently upgraded**;
  so is anything that is not a web address at all — local files, inline data and the like.
- An address whose host is a private, loopback, link-local or otherwise internal one is refused.
  This covers loopback and its named forms, the private network ranges, the link-local range that
  cloud metadata services live on, carrier-grade NAT, the equivalents in the newer address format
  including the forms that embed an older-format address, and hostnames in the conventional
  internal and local-network zones.
- Text that is not an address at all is refused as such.

Every refusal states which rule was broken in a sentence a non-technical client can act on, names
the address that was refused, and is reported as a bad request rather than a server failure. No
material is created and no network request is made for a refused address.

## Verification

Drive the retrieval entry point with a stand-in for the network that records every address
requested. For an insecure address, a local-file address, an inline-data address, loopback by
number and by name, an address in each private range, the metadata link-local address, a
carrier-grade NAT address, the newer-format loopback and internal ranges, an embedded older-format
loopback address, an internal-zone hostname, and a string that is not an address: assert each is
refused, that the message names the rule and the address, that the refusal is reported as a bad
request, that no material record exists afterwards, and that the recorder shows no request was made
for any of them.
