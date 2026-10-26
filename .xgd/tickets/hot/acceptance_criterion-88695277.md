---
uid: acceptance_criterion-88695277
id: AC-2016
type: acceptance_criterion
title: A file handed over as background while a site is open, and a promotion that
  failed softly, record no placement and keep the material
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:26:34.419931+00:00'
updated_at: '2026-10-26T01:26:34.419931+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

Which site was open when a file was handed over is never recorded as placement. Two hand-overs
that name a site leave the material's placement list empty, and keep the material either way:

- a file handed over as background (only for the platform to read) while a site is selected — it
  is stored and listed as the client's material, places nothing on the site, and records no
  placement;
- a file handed over for the site whose promotion fails softly — the hand-over still succeeds and
  reports the named placement failure, the material is stored and listed, and it records no
  placement.

A file fetched from an address on the client's behalf takes no site at all, and likewise records no
placement.

## Verification

Through the platform's material entry point, with a site of the client's selected:

- hand over a file as background naming the open site; observe a successful hand-over that
  produced no site asset, and that the listed material's placement list is empty;
- hand over a file for the site naming a site that cannot be written to; observe the successful
  hand-over carrying the placement failure, and that the listed material's placement list is
  empty;
- in both cases observe the material is still listed and retrievable.
