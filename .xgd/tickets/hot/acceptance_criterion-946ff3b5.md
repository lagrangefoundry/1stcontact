---
uid: acceptance_criterion-946ff3b5
id: AC-1715
type: acceptance_criterion
title: The list is the whole account's material, and the open site is a badge on the
  rows it applies to rather than a boundary on the list
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:41.292816+00:00'
updated_at: '2026-09-11T05:18:41.292816+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The Library lists the whole account's material, never one site's: material bound to the site
currently open, material bound to another of the client's sites, and material bound to no site
at all are all listed together, with no filter applied.

The site currently open decides a badge and nothing else. A row whose material is bound to the
open site carries a visible "used on this site" mark; every other row carries no such mark, and
no row is withheld on the strength of its binding.

## Verification

With an account holding at least three pieces of material — one bound to the open site, one
bound to a different site of the same client, one bound to no site — open the Library with no
filter set. Observe all three rows present, including the one bound to the other site and the
one bound to none. Observe exactly one row carrying the "used on this site" mark, and that it is
the row bound to the open site.
