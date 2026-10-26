---
uid: acceptance_criterion-946ff3b5
id: AC-1715
type: acceptance_criterion
title: The list is the whole account's material, and the open site is a badge on the
  rows whose recorded placement includes it rather than a boundary on the list
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:41.292816+00:00'
updated_at: '2026-10-26T01:26:15.235001+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The Library lists the whole account's material, never one site's: material placed on the site
currently open, material placed on another of the client's sites, and material placed on no site
at all are all listed together, with no filter applied.

The site currently open decides a badge and nothing else. A row carries a visible "On this site"
mark exactly when the material's recorded placement — the list of sites a promotion has actually
landed it on — includes the open site. Which site was open when the file was handed over does not
decide the mark: material handed over while the open site was selected but never placed on it
(handed over as background, or whose promotion failed) carries no mark. No row is withheld on the
strength of its placement.

## Verification

With an account holding at least four pieces of material — one placed on the open site, one placed
on a different site of the same client, one placed on no site, and one handed over as background
while the open site was selected — open the Library with no filter set. Observe all four rows
present. Observe exactly one row carrying the "On this site" mark, and that it is the row placed
on the open site; the background material handed over while that site was open carries none.
