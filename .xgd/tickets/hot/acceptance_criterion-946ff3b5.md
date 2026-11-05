---
uid: acceptance_criterion-946ff3b5
id: AC-1715
type: acceptance_criterion
title: The list is the whole of the open business's material, placed or not, with
  no placement badge, and a business switch leaves no row from the previous business
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:41.292816+00:00'
updated_at: '2026-11-05T21:07:22.927029+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
  title: The list is the whole of the open business's material, placed or not, with
    no placement badge, and a business switch closes the change feed before the re-read
    and reopens it under the new scope, leaving no row or event from the previous
    business
---

## Criterion

The Library lists the whole of the open business's material: material placed on the business's
site and material placed on no site at all are listed together, with no filter applied. No row is
withheld on the strength of its placement, and no row carries an "On this site" mark — under one
site per business a placement badge would only restate the normal case (see the warning criterion
for the one placement state that is marked).

The Library does not depend on which site is open. Choosing a different business in the header
selector — which, under one site per business, is what switching site means — replaces the list
with that business's material, as a clear-and-re-read rather than a patch: the rows on screen are
dropped **and the change feed for the previous business is closed** before the new business's
material is requested; the list is then filled from what comes back, and a new change feed is
opened under the new business's scope from the cursor that read returned. No row from the previous
business remains visible after a switch, and no change event from the previous business is applied
after it — including when the request for the new business's material fails (the list is then
empty rather than the previous business's, and no feed is left open on the previous business).
Destroying the Library closes its feed too.

## Verification

With a business holding material placed on its site, material placed nowhere, and background
material, open the Library with no filter set: observe every row present and none carrying an
"On this site" mark. Switch the header selector to a second business holding different material
and observe only the second business's rows, the first business's feed closed and a feed open
under the second. Deliver an event from the first business's feed after the switch and observe it
not applied. Switch again with the listing request failing and observe that none of the previous
business's rows remain and its feed is closed.
