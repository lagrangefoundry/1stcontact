---
uid: acceptance_criterion-cbbd3ee4
id: AC-1751
type: acceptance_criterion
title: A grant whose start is in the future makes its business unselectable rather
  than refusing the person outright
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:05.030173+00:00'
updated_at: '2026-11-01T01:33:28.931037+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A grant whose start is in the future does not admit its business: that business
is reported unselectable, with no effective grant, rather than refusing the person
outright. Access written ahead of time is a promise about the future, not access
today, so an operator cannot hand out access by scheduling it. The person is
refused only if no other business they hold is entitled.

## Verification

Invite an address, move the created grant's start into the future leaving
everything else untouched, and attempt admission. Assert the business is reported
unselectable with no grant; with no other entitled business, assert admission is
refused with the entitlement as the reported reason. Give the same person a
second, entitled business and assert they are admitted with the future-dated
business still listed and unselectable.
