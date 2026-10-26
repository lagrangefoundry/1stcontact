---
uid: acceptance_criterion-7a1805f5
id: AC-1722
type: acceptance_criterion
title: Listing the account's material returns rows newest first carrying no descriptions,
  reading one adds its description, and neither reaches another account
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:19:10.547234+00:00'
updated_at: '2026-10-26T01:51:16.374594+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Asking the platform for the client's material returns a list of rows, newest first, describing
each piece of material well enough to draw and filter a list — its identity, its title, its
filename, its kind, what it is for, its rights record, whether it may appear on the site, which
sites it is placed on (the list of sites a promotion actually landed its bytes on, empty for
material placed nowhere — never the site that was open when it was handed over), how its
description came to be, and when it last changed — and **carrying no descriptions**, because a
description is a document's extracted text and a list carrying them would ship the client's
whole corpus to draw a column of filenames.

Asking for one piece of material returns the same row **plus** its description.

Both answers are confined to the account asking: material belonging to another account is never
listed or returned, whatever identifier is asked for.

## Verification

Add two pieces of material to one account, one handed over for a site it is then placed on and
one placed on none. Ask that account for its material and observe both rows present, ordered
newest first, each carrying filename, kind, role, rights and placement — the placed one listing
its site, the other an empty list — and none carrying a description. Ask for one of them
individually and observe the same fields plus its description text. Ask a second account for
its material and observe an empty list.
