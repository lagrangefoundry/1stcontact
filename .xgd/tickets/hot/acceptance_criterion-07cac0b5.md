---
uid: acceptance_criterion-07cac0b5
id: AC-1568
type: acceptance_criterion
title: Listing the account's material carries no descriptions; asking for one piece
  carries its description
created_by: xgd
created_at: '2026-09-04T04:27:46.199711+00:00'
updated_at: '2026-09-04T04:27:46.199711+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

The listing of the account's material carries, per row, what is needed to draw and narrow the list —
its identity, the name it arrived under, its title, its kind, what it is for, its rights and
republishability, its origin and source address, which site uses it, whether its description is a
real one, and when it last changed — and does **not** carry the descriptions themselves. A
material's description is its extracted text and a brand book runs to tens of kilobytes of it; a
listing carrying them would ship the account's whole corpus to draw a column of names.

Asking for a single named piece of material returns the same row **plus** its description.

## Verification

Ingest material whose description contains a distinctive phrase. Request the listing and assert
every field above is present on the row and that the description text appears nowhere in the
response. Request that one material by name and assert the response carries the same row fields plus
the description, with the distinctive phrase present.
