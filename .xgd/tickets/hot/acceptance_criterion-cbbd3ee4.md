---
uid: acceptance_criterion-cbbd3ee4
id: AC-1751
type: acceptance_criterion
title: A grant whose start is in the future makes its business unselectable rather
  than refusing the person outright
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:05.030173+00:00'
updated_at: '2026-11-01T10:15:02.949490+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A grant whose start is in the future does not admit its business: that business
is reported unselectable, with no effective grant and the lapse reason
`not_yet`. Access written ahead of time is a promise about the future, not access
today, so an operator cannot hand out access by scheduling it. The person is not
refused on that account: membership admits, so a person whose only business is
future-dated is still admitted, with that business listed and nothing
selectable.

## Verification

Invite an address, move the created grant's start into the future leaving
everything else untouched, and attempt admission. Assert it succeeds, listing
that one business as unselectable, with no grant and lapse reason `not_yet`.
Give the same person a second, entitled business and assert they are admitted
with the future-dated business still listed and unselectable beside the
selectable one.
