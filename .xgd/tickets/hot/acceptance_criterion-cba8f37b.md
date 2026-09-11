---
uid: acceptance_criterion-cba8f37b
id: AC-1700
type: acceptance_criterion
title: Material is retrieved only over a secure web address; an insecure, non-web
  or unreadable address is refused and never silently upgraded
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:42:22.295732+00:00'
updated_at: '2026-09-11T04:58:07.812075+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

Material is retrieved **only** over a secure web address. Every other form of address is refused,
and the refusal is a client-side refusal naming the address, not a server failure:

- An insecure web address is refused rather than silently upgraded to a secure one, and the
  refusal message names the scheme that was rejected. The platform never retrieves an address
  other than the one it was given.
- An address whose scheme is not the web at all (a local file, an inline data address, and
  anything else) is refused through the same rule.
- A string that cannot be read as a web address at all is refused with a message saying it does
  not look like a web address, quoting what was supplied.

A secure web address on an ordinary public host is accepted by this rule and proceeds to the
remaining checks.

## Verification

Request a retrieval of an insecure `http` address and assert it is refused, that the refusal is
reported as the caller's error (not a server failure or a permission), that the message names the
scheme, and that the refusal carries the requested address. Repeat with a local-file address, an
inline data address, and a string that is not an address at all, asserting a refusal each time
with the not-an-address wording for the last. Assert that no retrieval of any other address was
attempted in the insecure case — the refusal happens before any network reach, and in particular
the secure form of the same address is never fetched. Finally assert a secure public address is
not refused by this rule.