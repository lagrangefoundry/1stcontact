---
uid: acceptance_criterion-27815e0f
id: AC-905
type: acceptance_criterion
title: The revision record, not the key space, is the authority on what a URL may
  reach
created_by: xgd
created_at: '2026-08-06T18:48:54.054985+00:00'
updated_at: '2026-08-31T11:52:38.942730+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The revision record, not the storage key space, is the authority on what a URL
may reach. A revision whose rendered bytes are in storage but which the record
does not vouch for — an interrupted publish, or one nobody has swept — is not
reachable at any URL.

The guarantee is that no component of a requested URL names stored bytes unless
a record vouched for them first. The only untrusted value that reaches a storage
key is the site name, and the address grammar has already refused anything that
is not a plain name; every other part of the key is composed from server-side
constants and the value the record itself supplied. A visitor therefore cannot
craft an address that reads bytes the record did not name — including bytes that
belong to the same site.

Two consequences follow from that composition and are asserted here rather than
assumed:

- **Only a revision's rendered output is addressable.** Each revision also ships
  the frozen definition it was rendered from, because the database holds only
  the mutable draft and that copy is what makes a checkout possible. The
  composed key ends at the rendered half, so no URL the grammar admits reaches
  the definition — including one whose path spells out its stored location.
- **The record vouching for bytes that are absent is a not-found, not an
  error.** A record naming a revision whose output never finished uploading
  answers with the ordinary opaque not-found, the same as any other unreachable
  address, rather than reporting a storage inconsistency to a visitor who cannot
  act on it.

## Verification

Publish a site so a real record and real bytes exist. Place further rendered
bytes in storage at the key shape a revision would occupy without any record
naming them, and assert a request for their would-be address returns not-found
while the recorded revision for the same site still serves. Drive the public
entry point with addresses that attempt to reach the frozen definition beside
the served output — the dot-segment forms and their percent-encoded spellings,
plus a path that names the stored location verbatim — and assert every one
returns not-found without the definition's bytes ever being returned. Point the
record at a revision id for which nothing was ever uploaded and assert the
site's URL returns not-found rather than a server error.
