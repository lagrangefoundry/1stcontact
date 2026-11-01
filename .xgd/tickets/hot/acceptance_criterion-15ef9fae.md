---
uid: acceptance_criterion-15ef9fae
id: AC-1753
type: acceptance_criterion
title: A membership that is not active excludes its business; the person is refused
  only when no active membership remains, grants untouched
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:12.668299+00:00'
updated_at: '2026-11-01T01:33:32.793541+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A membership that is no longer active excludes its business from the person's
admission whatever that business's grant says, and leaves the grant untouched —
removing one person from a business must not remove the access the business's
other people are living on. A membership is not active when it is withdrawn, when
its status is not active, or when its own expiry has passed. The person is
refused, with the membership reported as the reason rather than the entitlement,
only when no active membership remains.

## Verification

Invite an address, withdraw the created membership leaving the grant alone, and
attempt admission: assert it is refused, that the reported reason is the
membership, and that reading the business's grant back still shows it active.
Repeat for a membership whose status is set to something other than active and
for one whose expiry is in the past.
