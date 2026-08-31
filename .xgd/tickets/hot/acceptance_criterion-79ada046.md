---
uid: acceptance_criterion-79ada046
id: AC-1388
type: acceptance_criterion
title: A site's write version is readable and advances on every write, independently
  of the change count
created_by: xgd
created_at: '2026-08-31T09:47:29.968841+00:00'
updated_at: '2026-08-31T09:47:29.968841+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

A site has a readable write version, and every write advances it.

- Reading the version of a site the store holds returns an integer; reading the version of a site
  it does not hold reports that absence rather than a number.
- Applying a change with no version expectation always lands, and the version afterwards is
  strictly greater than the version before.
- The version is distinct from the change count: a write that records nothing in the change log
  still moves the version, and the change count stands still. A number that could stand still
  across a write would be unusable as the thing a conditional write is checked against.

## Verification

Read a site's version, apply an unconditional change, and read it again — the second value is
greater. Apply a change that journals nothing and observe the version move while the change count
does not. Read the version for a site name the store does not hold and observe the absence report
rather than zero or an error.
