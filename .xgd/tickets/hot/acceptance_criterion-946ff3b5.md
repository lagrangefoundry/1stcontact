---
uid: acceptance_criterion-946ff3b5
id: AC-1715
type: acceptance_criterion
title: The list is the whole account's material, and the open site is a badge on the
  rows whose recorded placement includes it rather than a boundary on the list
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:41.292816+00:00'
updated_at: '2026-11-01T12:05:26.093677+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
  title: The list is the whole of the open business's material, placed or not, with
    no placement badge, and a business switch leaves no row from the previous business
---

## Criterion

The Library lists the whole of the open business's material: material placed on the business's
site and material placed on no site at all are listed together, with no filter applied. No row is
withheld on the strength of its placement, and no row carries an "On this site" mark — under one
site per business a placement badge would only restate the normal case (see the warning criterion
for the one placement state that is marked).

The Library does not depend on which site is open. Choosing a different business in the header
selector — which, under one site per business, is what switching site means — replaces the list
with that business's material: the rows on screen are dropped before the new business's material
is requested, and the list is then filled from what comes back. No row from the previous business
remains visible after a switch, including when the request for the new business's material fails
(the list is then empty rather than the previous business's).

## Verification

With a business holding material placed on its site, material placed nowhere, and background
material, open the Library with no filter set: observe every row present and none carrying an
"On this site" mark. Switch the header selector to a second business holding different material
and observe only the second business's rows. Switch again with the listing request failing and
observe that none of the previous business's rows remain.
